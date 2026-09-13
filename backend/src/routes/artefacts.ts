import { Router, Response } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, getIp } from "../middleware/auth";
import { logAuditEvent } from "../lib/audit";
import { saveFile, deleteFile, validateImageFile, validateAudioFile, validateBufferMime } from "../lib/storage";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/v1/artefacts
router.get("/", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const { search = "", status, categoryId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (p - 1) * l;

  const where: Prisma.ArtefactWhereInput = {
    ...(search ? { title: { contains: search } } : {}),
    ...(status ? { status: status as "active" | "inactive" | "draft" } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [artefacts, total] = await Promise.all([
    prisma.artefact.findMany({
      where, skip, take: l, orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: "asc" }, take: 1, select: { imageUrl: true, altText: true } },
        qrCode: { select: { isActive: true, publicUrl: true } },
      },
    }),
    prisma.artefact.count({ where }),
  ]);

  res.json({ artefacts, total, page: p, limit: l, pages: Math.ceil(total / l) });
});

// POST /api/v1/artefacts
router.post("/", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, categoryId, locationId, status = "draft", metadata } = req.body ?? {};
  if (!title?.trim()) { res.status(422).json({ error: { message: "Title is required", code: "VALIDATION_ERROR" } }); return; }

  const artefact = await prisma.artefact.create({
    data: {
      uniquePublicId: uuidv4(),
      title: title.trim(),
      description: description?.trim() ?? null,
      categoryId: categoryId ?? null,
      locationId: locationId ?? null,
      status: status ?? "draft",
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
    include: { category: { select: { id: true, name: true } }, location: { select: { id: true, name: true } } },
  });

  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "artefact", entityId: artefact.id, changes: { title: artefact.title }, ipAddress: getIp(req) });
  res.status(201).json({ artefact });
});

// GET /api/v1/artefacts/:id
router.get("/:id", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const artefact = await prisma.artefact.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      audio: true,
      qrCode: true,
    },
  });
  if (!artefact) { res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } }); return; }
  res.json({ artefact });
});

// PUT /api/v1/artefacts/:id
router.put("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const { title, description, categoryId, locationId, status, metadata } = req.body ?? {};
  if (!title?.trim()) { res.status(422).json({ error: { message: "Title is required", code: "VALIDATION_ERROR" } }); return; }

  const artefact = await prisma.artefact.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description?.trim() ?? null,
      categoryId: categoryId ?? null,
      locationId: locationId ?? null,
      ...(status ? { status } : {}),
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      audio: true,
      qrCode: true,
    },
  });

  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "artefact", entityId: id, changes: { title, status }, ipAddress: getIp(req) });
  res.json({ artefact });
});

// DELETE /api/v1/artefacts/:id
router.delete("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const artefact = await prisma.artefact.findUnique({ where: { id }, include: { images: true, audio: true, qrCode: true } });
  if (!artefact) { res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } }); return; }

  for (const img of artefact.images) await deleteFile(img.storagePath);
  if (artefact.audio) await deleteFile(artefact.audio.storagePath);
  if (artefact.qrCode?.qrImagePath) await deleteFile(artefact.qrCode.qrImagePath);

  await prisma.artefact.delete({ where: { id } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "artefact", entityId: id, changes: { title: artefact.title }, ipAddress: getIp(req) });
  res.json({ success: true });
});

// POST /api/v1/artefacts/:id/images
router.post("/:id/images", requireAuth("editor"), upload.array("images", 20), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: { message: "No files uploaded", code: "VALIDATION_ERROR" } }); return; }

  const existing = await prisma.artefactImage.count({ where: { artefactId: id } });
  const images = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const err = validateImageFile(file.mimetype, file.size) ?? validateBufferMime(file.buffer, "image");
    if (err) continue;
    const { storagePath, url } = await saveFile(file.buffer, file.originalname, "images");
    const img = await prisma.artefactImage.create({ data: { artefactId: id, storagePath, imageUrl: url, displayOrder: existing + i } });
    images.push(img);
  }

  if (!images.length) { res.status(422).json({ error: { message: "No valid images uploaded", code: "VALIDATION_ERROR" } }); return; }
  res.status(201).json({ images });
});

// DELETE /api/v1/artefacts/:id/images/:imageId
router.delete("/:id/images/:imageId", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const imageId = req.params.imageId;
  const img = await prisma.artefactImage.findUnique({ where: { id: imageId } });
  if (!img) { res.status(404).json({ error: { message: "Image not found", code: "NOT_FOUND" } }); return; }
  await deleteFile(img.storagePath);
  await prisma.artefactImage.delete({ where: { id: imageId } });
  res.json({ success: true });
});

// POST /api/v1/artefacts/:id/audio
router.post("/:id/audio", requireAuth("editor"), upload.single("audio"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const file = req.file;
  if (!file) { res.status(400).json({ error: { message: "No file uploaded", code: "VALIDATION_ERROR" } }); return; }
  const err = validateAudioFile(file.mimetype, file.size) ?? validateBufferMime(file.buffer, "audio");
  if (err) { res.status(422).json({ error: { message: err, code: "VALIDATION_ERROR" } }); return; }

  const existing = await prisma.artefactAudio.findUnique({ where: { artefactId: id } });
  if (existing) { await deleteFile(existing.storagePath); await prisma.artefactAudio.delete({ where: { artefactId: id } }); }

  const { storagePath, url } = await saveFile(file.buffer, file.originalname, "audio");
  const audio = await prisma.artefactAudio.create({ data: { artefactId: id, storagePath, audioUrl: url } });
  res.status(201).json({ audio });
});

// GET /api/v1/artefacts/:id/qr
router.get("/:id/qr", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const artefact = await prisma.artefact.findUnique({ where: { id }, include: { qrCode: true } });
  if (!artefact) { res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } }); return; }

  let qrDataUrl: string | null = null;
  if (artefact.qrCode?.publicUrl) {
    const QRCode = await import("qrcode");
    qrDataUrl = await QRCode.default.toDataURL(artefact.qrCode.publicUrl, { width: 512, margin: 2 });
  }

  res.json({ artefact: { id: artefact.id, title: artefact.title, uniquePublicId: artefact.uniquePublicId }, qrCode: artefact.qrCode, qrDataUrl });
});

// POST /api/v1/artefacts/:id/qr
router.post("/:id/qr", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const QRCode = await import("qrcode");
  const artefact = await prisma.artefact.findUnique({ where: { id } });
  if (!artefact) { res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } }); return; }

  const APP_URL = process.env.APP_URL ?? "http://localhost:4000";
  const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const publicUrl = `${FRONTEND_URL}/a/${artefact.uniquePublicId}`;
  const shortCode = artefact.uniquePublicId.split("-")[0];
  const dataUrl = await QRCode.default.toDataURL(publicUrl, { width: 512, margin: 2 });

  const existing = await prisma.qrCode.findUnique({ where: { artefactId: id } });
  let qrCode;
  if (existing) {
    if (existing.qrImagePath) await deleteFile(existing.qrImagePath);
    qrCode = await prisma.qrCode.update({ where: { artefactId: id }, data: { publicUrl, isActive: true } });
  } else {
    qrCode = await prisma.qrCode.create({ data: { artefactId: id, uniqueShortCode: shortCode, publicUrl, isActive: true } });
  }

  res.json({ qrCode, qrDataUrl: dataUrl });
});

export default router;
