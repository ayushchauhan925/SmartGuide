import express, { Router } from "express";
import { ArtefactStatus, Prisma, UserRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, query, requireAuth } from "../lib/http.js";
import { logAuditEvent } from "../lib/audit.js";
import { storage, validateAudioFile, validateImageFile } from "../lib/storage.js";
import { optimizeImage } from "../lib/image.js";
import { generateQRCode } from "../lib/qr.js";
import { parseCsv, toCsv } from "../lib/csv.js";
import { isLanguage, DEFAULT_LANGUAGE } from "../lib/languages.js";
import { upload } from "../lib/upload.js";

export const artefactsRouter = Router();

const META_COLUMNS = ["period", "material", "dimensions", "discovered_at", "artist", "origin", "language"];
const STATUSES = ["active", "inactive", "draft"] as const;

const detailInclude = {
  category: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  images: { orderBy: { displayOrder: "asc" as const } },
  audio: true,
  qrCode: true,
};

function snapshotOf(a: {
  title: string; description: string | null; categoryId: number | null; locationId: number | null; status: string;
  metadata: Prisma.JsonValue; videoUrl: string | null; modelUrl: string | null; mapX: number | null; mapY: number | null;
}) {
  return {
    title: a.title, description: a.description, categoryId: a.categoryId, locationId: a.locationId, status: a.status,
    metadata: a.metadata, videoUrl: a.videoUrl, modelUrl: a.modelUrl, mapX: a.mapX, mapY: a.mapY,
  } as Prisma.InputJsonValue;
}

// ── Collection ───────────────────────────────────────────────────

artefactsRouter.get("/", requireAuth(), async (req, res) => {
  const search = query(req, "search") ?? "";
  const status = query(req, "status");
  const categoryId = query(req, "categoryId") ? parseInt(query(req, "categoryId")!) : undefined;
  const page = Math.max(1, parseInt(query(req, "page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query(req, "limit") ?? "20") || 20));

  const where: Prisma.ArtefactWhereInput = {
    ...(search ? { title: { contains: search } } : {}),
    ...(status ? { status: status as ArtefactStatus } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [artefacts, total] = await Promise.all([
    prisma.artefact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: "asc" }, take: 1, select: { imageUrl: true, altText: true } },
        qrCode: { select: { isActive: true, publicUrl: true } },
      },
    }),
    prisma.artefact.count({ where }),
  ]);
  res.json({ artefacts, total, page, limit, pages: Math.ceil(total / limit) });
});

artefactsRouter.post("/", requireAuth(UserRole.editor), async (req, res) => {
  const { title, description, categoryId, locationId, status = "draft", metadata } = (req.body ?? {}) as {
    title?: string; description?: string; categoryId?: number; locationId?: number;
    status?: string; metadata?: Record<string, unknown>;
  };
  if (!title?.trim()) return apiError(res, "Title is required", "VALIDATION_ERROR", 422);

  const artefact = await prisma.artefact.create({
    data: {
      uniquePublicId: uuidv4(),
      title: title.trim(),
      description: description?.trim() ?? null,
      categoryId: categoryId ?? null,
      locationId: locationId ?? null,
      status: (status as ArtefactStatus) ?? "draft",
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
    include: { category: { select: { id: true, name: true } }, location: { select: { id: true, name: true } } },
  });
  await logAuditEvent({
    userId: req.user!.userId, action: "create", entityType: "artefact", entityId: artefact.id,
    changes: { title: artefact.title }, ipAddress: getIp(req),
  });
  res.status(201).json({ artefact });
});

artefactsRouter.get("/export", requireAuth(), async (_req, res) => {
  const artefacts = await prisma.artefact.findMany({
    orderBy: { id: "asc" },
    include: { category: true, location: true, qrCode: { select: { scanCount: true } } },
  });
  const header = ["id", "public_id", "title", "description", "category", "location", "status", ...META_COLUMNS, "scan_count"];
  const rows = artefacts.map((a) => {
    const meta = (a.metadata ?? {}) as Record<string, string>;
    return [
      a.id, a.uniquePublicId, a.title, a.description, a.category?.name, a.location?.name, a.status,
      ...META_COLUMNS.map((k) => meta[k] ?? ""),
      a.qrCode?.scanCount ?? 0,
    ];
  });
  res
    .type("text/csv; charset=utf-8")
    .attachment(`artefacts-${new Date().toISOString().slice(0, 10)}.csv`)
    .send("﻿" + toCsv([header, ...rows]));
});

/**
 * Body: CSV text. Required column: title. Optional: description, category, location, status, metadata columns.
 * Unknown categories/locations are created. If public_id matches an existing artefact it is updated, otherwise created.
 * Query ?dryRun=1 validates without writing.
 */
artefactsRouter.post(
  "/import",
  requireAuth(UserRole.editor),
  express.text({ type: "*/*", limit: "5mb" }),
  async (req, res) => {
    const dryRun = query(req, "dryRun") === "1";
    const text = typeof req.body === "string" ? req.body : "";

    const rows = parseCsv(text);
    if (rows.length < 2) return apiError(res, "CSV must have a header row and at least one data row", "VALIDATION_ERROR", 422);
    const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const col = (name: string) => header.indexOf(name);
    if (col("title") < 0) return apiError(res, "Missing required column: title", "VALIDATION_ERROR", 422);

    const errors: { row: number; message: string }[] = [];
    const parsed = rows.slice(1).map((r, i) => {
      const get = (name: string) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");
      const title = get("title");
      const status = (get("status") || "draft").toLowerCase();
      if (!title) errors.push({ row: i + 2, message: "Title is empty" });
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) errors.push({ row: i + 2, message: `Invalid status "${status}"` });
      const metadata: Record<string, string> = {};
      for (const k of META_COLUMNS) if (get(k)) metadata[k] = get(k);
      return {
        publicId: get("public_id"),
        title,
        description: get("description") || null,
        category: get("category"),
        location: get("location"),
        status: status as ArtefactStatus,
        metadata,
      };
    });

    if (errors.length) return res.status(422).json({ created: 0, updated: 0, errors });
    if (dryRun) return res.json({ valid: parsed.length, errors: [] });

    let created = 0;
    let updated = 0;
    const catCache = new Map<string, number>();
    const locCache = new Map<string, number>();

    for (const p of parsed) {
      let categoryId: number | null = null;
      if (p.category) {
        categoryId = catCache.get(p.category) ?? null;
        if (!categoryId) {
          const c = await prisma.category.upsert({ where: { name: p.category }, update: {}, create: { name: p.category } });
          categoryId = c.id;
          catCache.set(p.category, c.id);
        }
      }
      let locationId: number | null = null;
      if (p.location) {
        locationId = locCache.get(p.location) ?? null;
        if (!locationId) {
          const l = (await prisma.location.findFirst({ where: { name: p.location } })) ??
            (await prisma.location.create({ data: { name: p.location } }));
          locationId = l.id;
          locCache.set(p.location, l.id);
        }
      }

      const data = {
        title: p.title,
        description: p.description,
        status: p.status,
        categoryId,
        locationId,
        metadata: Object.keys(p.metadata).length ? (p.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      };
      const existing = p.publicId
        ? await prisma.artefact.findUnique({ where: { uniquePublicId: p.publicId }, select: { id: true } })
        : null;
      if (existing) {
        await prisma.artefact.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.artefact.create({ data });
        created++;
      }
    }

    await logAuditEvent({ userId: req.user!.userId, action: "import", entityType: "artefact", changes: { created, updated }, ipAddress: getIp(req) });
    res.json({ created, updated, errors: [] });
  }
);

/** Body: { ids: number[], action: "active" | "inactive" | "draft" | "delete" } */
artefactsRouter.post("/bulk", requireAuth(UserRole.editor), async (req, res) => {
  const ACTIONS = ["active", "inactive", "draft", "delete"];
  const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.filter(Number.isInteger).slice(0, 500) : [];
  const action = req.body?.action;
  if (!ids.length) return apiError(res, "No artefacts selected", "VALIDATION_ERROR", 422);
  if (!ACTIONS.includes(action)) return apiError(res, "Invalid action", "VALIDATION_ERROR", 422);

  const result =
    action === "delete"
      ? await prisma.artefact.deleteMany({ where: { id: { in: ids } } })
      : await prisma.artefact.updateMany({ where: { id: { in: ids } }, data: { status: action } });

  await logAuditEvent({
    userId: req.user!.userId, action: action === "delete" ? "bulk_delete" : "bulk_update", entityType: "artefact",
    changes: { ids, action }, ipAddress: getIp(req),
  });
  res.json({ count: result.count });
});

// ── Single artefact ──────────────────────────────────────────────

artefactsRouter.get("/:id", requireAuth(), async (req, res) => {
  const artefact = await prisma.artefact.findUnique({ where: { id: intParam(req) }, include: detailInclude });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);
  res.json({ artefact });
});

artefactsRouter.put("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const existing = await prisma.artefact.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const body = (req.body ?? {}) as Record<string, unknown>;
  const { title, description, categoryId, locationId, status, metadata, videoUrl, modelUrl, mapX, mapY } = body as {
    title?: string; description?: string; categoryId?: number | null; locationId?: number | null;
    status?: string; metadata?: Record<string, unknown> | null;
    videoUrl?: string | null; modelUrl?: string | null; mapX?: number | null; mapY?: number | null;
  };

  if (title !== undefined && !title.trim()) return apiError(res, "Title cannot be empty", "VALIDATION_ERROR", 422);
  for (const [name, url] of [["Video URL", videoUrl], ["3D model URL", modelUrl]] as const) {
    if (url && !/^https?:\/\/\S+$/i.test(url)) return apiError(res, `${name} must be an http(s) link`, "VALIDATION_ERROR", 422);
  }
  for (const v of [mapX, mapY]) {
    if (v !== undefined && v !== null && (typeof v !== "number" || v < 0 || v > 100))
      return apiError(res, "Map position must be between 0 and 100", "VALIDATION_ERROR", 422);
  }

  // Snapshot the current state so it can be restored from the history page
  await prisma.artefactVersion.create({ data: { artefactId: numId, userId: req.user!.userId, snapshot: snapshotOf(existing) } });

  const artefact = await prisma.artefact.update({
    where: { id: numId },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
      ...(locationId !== undefined ? { locationId: locationId ?? null } : {}),
      ...(status !== undefined ? { status: status as ArtefactStatus } : {}),
      ...(metadata !== undefined ? { metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull } : {}),
      ...(videoUrl !== undefined ? { videoUrl: videoUrl?.trim() || null } : {}),
      ...(modelUrl !== undefined ? { modelUrl: modelUrl?.trim() || null } : {}),
      ...(mapX !== undefined ? { mapX } : {}),
      ...(mapY !== undefined ? { mapY } : {}),
    },
    include: detailInclude,
  });

  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "artefact", entityId: numId, changes: body, ipAddress: getIp(req) });
  res.json({ artefact });
});

artefactsRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const existing = await prisma.artefact.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  await prisma.artefact.delete({ where: { id: numId } });
  await logAuditEvent({
    userId: req.user!.userId, action: "delete", entityType: "artefact", entityId: numId,
    changes: { title: existing.title }, ipAddress: getIp(req),
  });
  res.json({ success: true });
});

/** Copies text, metadata, category/location and translations into a new draft. Media files are not copied. */
artefactsRouter.post("/:id/duplicate", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const src = await prisma.artefact.findUnique({ where: { id }, include: { translations: true } });
  if (!src) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const artefact = await prisma.artefact.create({
    data: {
      title: `${src.title} (copy)`,
      description: src.description,
      metadata: (src.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      categoryId: src.categoryId,
      locationId: src.locationId,
      status: "draft",
      translations: {
        create: src.translations.map((t) => ({ language: t.language, title: t.title, description: t.description })),
      },
    },
  });
  await logAuditEvent({
    userId: req.user!.userId, action: "duplicate", entityType: "artefact", entityId: artefact.id,
    changes: { from: id }, ipAddress: getIp(req),
  });
  res.status(201).json({ artefact });
});

// ── Images ───────────────────────────────────────────────────────

artefactsRouter.get("/:id/images", requireAuth(), async (req, res) => {
  const images = await prisma.artefactImage.findMany({ where: { artefactId: intParam(req) }, orderBy: { displayOrder: "asc" } });
  res.json({ images });
});

artefactsRouter.post("/:id/images", requireAuth(UserRole.editor), upload.array("images"), async (req, res) => {
  const numId = intParam(req);
  const artefact = await prisma.artefact.findUnique({ where: { id: numId } });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) return apiError(res, "No images provided", "VALIDATION_ERROR", 422);

  const savedImages = [];
  for (const file of files) {
    const validErr = validateImageFile(file.mimetype, file.size);
    if (validErr) return apiError(res, validErr, "VALIDATION_ERROR", 422);

    let optimized;
    try {
      optimized = await optimizeImage(file.buffer, file.originalname);
    } catch {
      return apiError(res, `${file.originalname} is not a valid image`, "VALIDATION_ERROR", 422);
    }
    const { storagePath, url } = await storage.save(optimized.buffer, optimized.filename, "images");

    const maxOrder = await prisma.artefactImage.findFirst({
      where: { artefactId: numId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const image = await prisma.artefactImage.create({
      data: {
        artefactId: numId,
        storagePath,
        imageUrl: url,
        altText: (req.body?.altText as string | undefined) ?? null,
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
      },
    });
    savedImages.push(image);
  }

  await logAuditEvent({
    userId: req.user!.userId, action: "upload_images", entityType: "artefact", entityId: numId,
    changes: { count: savedImages.length }, ipAddress: getIp(req),
  });
  res.status(201).json({ images: savedImages });
});

// ── Audio ────────────────────────────────────────────────────────

artefactsRouter.post("/:id/audio", requireAuth(UserRole.editor), upload.single("audio"), async (req, res) => {
  const numId = intParam(req);
  const artefact = await prisma.artefact.findUnique({ where: { id: numId } });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const file = req.file;
  if (!file) return apiError(res, "No audio file provided", "VALIDATION_ERROR", 422);
  const validErr = validateAudioFile(file.mimetype, file.size);
  if (validErr) return apiError(res, validErr, "VALIDATION_ERROR", 422);

  // Replace existing audio if any
  const existing = await prisma.artefactAudio.findUnique({ where: { artefactId: numId } });
  if (existing) {
    await storage.delete(existing.storagePath);
    await prisma.artefactAudio.delete({ where: { artefactId: numId } });
  }

  const { storagePath, url } = await storage.save(file.buffer, file.originalname, "audio");
  const audio = await prisma.artefactAudio.create({ data: { artefactId: numId, storagePath, audioUrl: url, duration: null } });

  await logAuditEvent({ userId: req.user!.userId, action: "upload_audio", entityType: "artefact", entityId: numId, ipAddress: getIp(req) });
  res.status(201).json({ audio });
});

artefactsRouter.delete("/:id/audio", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const audio = await prisma.artefactAudio.findUnique({ where: { artefactId: numId } });
  if (!audio) return apiError(res, "No audio found", "NOT_FOUND", 404);

  await storage.delete(audio.storagePath);
  await prisma.artefactAudio.delete({ where: { artefactId: numId } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete_audio", entityType: "artefact", entityId: numId, ipAddress: getIp(req) });
  res.json({ success: true });
});

// ── QR code ──────────────────────────────────────────────────────

artefactsRouter.get("/:id/qr", requireAuth(), async (req, res) => {
  const artefact = await prisma.artefact.findUnique({ where: { id: intParam(req) }, include: { qrCode: true } });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);
  res.json({ qrCode: artefact.qrCode, uniquePublicId: artefact.uniquePublicId });
});

artefactsRouter.post("/:id/qr", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const artefact = await prisma.artefact.findUnique({ where: { id: numId }, include: { qrCode: true } });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const { qrImagePath, publicUrl, dataUrl } = await generateQRCode(artefact.uniquePublicId);
  const qrCode = await prisma.qrCode.upsert({
    where: { artefactId: numId },
    create: { artefactId: numId, uniqueShortCode: uuidv4().split("-")[0], publicUrl, qrImagePath, isActive: true },
    update: { publicUrl, qrImagePath, isActive: true },
  });

  await logAuditEvent({
    userId: req.user!.userId, action: "generate_qr", entityType: "qr_code", entityId: qrCode.id,
    changes: { publicUrl }, ipAddress: getIp(req),
  });
  res.json({ qrCode, dataUrl });
});

artefactsRouter.delete("/:id/qr", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const qrCode = await prisma.qrCode.findUnique({ where: { artefactId: numId } });
  if (!qrCode) return apiError(res, "QR code not found", "NOT_FOUND", 404);

  await prisma.qrCode.update({ where: { artefactId: numId }, data: { isActive: false } });
  await logAuditEvent({ userId: req.user!.userId, action: "deactivate_qr", entityType: "qr_code", entityId: qrCode.id, ipAddress: getIp(req) });
  res.json({ success: true });
});

// ── Translations ─────────────────────────────────────────────────

artefactsRouter.get("/:id/translations", requireAuth(), async (req, res) => {
  const translations = await prisma.artefactTranslation.findMany({ where: { artefactId: intParam(req) }, orderBy: { language: "asc" } });
  res.json({ translations });
});

/** Body: { language, title, description? } upserts one translation. */
artefactsRouter.put("/:id/translations", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const body = req.body ?? {};
  if (!isLanguage(body.language) || body.language === DEFAULT_LANGUAGE)
    return apiError(res, "Unsupported language", "VALIDATION_ERROR", 422);
  if (!body.title?.trim()) return apiError(res, "Title is required", "VALIDATION_ERROR", 422);

  const exists = await prisma.artefact.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const data = { title: body.title.trim(), description: body.description?.trim() || null };
  const translation = await prisma.artefactTranslation.upsert({
    where: { artefactId_language: { artefactId: id, language: body.language } },
    update: data,
    create: { artefactId: id, language: body.language, ...data },
  });
  await logAuditEvent({
    userId: req.user!.userId, action: "update", entityType: "artefact_translation", entityId: id,
    changes: { language: body.language }, ipAddress: getIp(req),
  });
  res.json({ translation });
});

artefactsRouter.delete("/:id/translations", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const language = query(req, "language");
  if (!isLanguage(language)) return apiError(res, "Unsupported language", "VALIDATION_ERROR", 422);
  await prisma.artefactTranslation.deleteMany({ where: { artefactId: id, language } });
  await logAuditEvent({
    userId: req.user!.userId, action: "delete", entityType: "artefact_translation", entityId: id,
    changes: { language }, ipAddress: getIp(req),
  });
  res.json({ success: true });
});

// ── Version history ──────────────────────────────────────────────

artefactsRouter.get("/:id/versions", requireAuth(), async (req, res) => {
  const versions = await prisma.artefactVersion.findMany({
    where: { artefactId: intParam(req) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });
  res.json({ versions });
});

/** Body: { versionId } restores that snapshot (the current state is snapshotted first, so restores can be undone). */
artefactsRouter.post("/:id/versions", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const version = await prisma.artefactVersion.findFirst({ where: { id: req.body?.versionId, artefactId: id } });
  if (!version) return apiError(res, "Version not found", "NOT_FOUND", 404);
  const current = await prisma.artefact.findUnique({ where: { id } });
  if (!current) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const snap = version.snapshot as Record<string, unknown>;
  const [categoryOk, locationOk] = await Promise.all([
    snap.categoryId ? prisma.category.count({ where: { id: snap.categoryId as number } }) : 1,
    snap.locationId ? prisma.location.count({ where: { id: snap.locationId as number } }) : 1,
  ]);

  await prisma.$transaction([
    prisma.artefactVersion.create({ data: { artefactId: id, userId: req.user!.userId, snapshot: snapshotOf(current) } }),
    prisma.artefact.update({
      where: { id },
      data: {
        title: snap.title as string,
        description: (snap.description as string | null) ?? null,
        categoryId: categoryOk ? ((snap.categoryId as number | null) ?? null) : null,
        locationId: locationOk ? ((snap.locationId as number | null) ?? null) : null,
        status: snap.status as ArtefactStatus,
        metadata: snap.metadata ? (snap.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        videoUrl: (snap.videoUrl as string | null) ?? null,
        modelUrl: (snap.modelUrl as string | null) ?? null,
        mapX: (snap.mapX as number | null) ?? null,
        mapY: (snap.mapY as number | null) ?? null,
      },
    }),
  ]);

  await logAuditEvent({
    userId: req.user!.userId, action: "restore_version", entityType: "artefact", entityId: id,
    changes: { versionId: version.id }, ipAddress: getIp(req),
  });
  res.json({ success: true });
});
