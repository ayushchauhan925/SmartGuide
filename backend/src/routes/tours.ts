import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, requireAuth } from "../lib/http.js";
import { logAuditEvent } from "../lib/audit.js";

export const toursRouter = Router();

const include = {
  stops: {
    orderBy: { position: "asc" as const },
    include: { artefact: { select: { id: true, title: true, uniquePublicId: true } } },
  },
};

toursRouter.get("/", requireAuth(), async (_req, res) => {
  const tours = await prisma.tour.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { stops: true } } } });
  res.json({ tours });
});

toursRouter.post("/", requireAuth(UserRole.editor), async (req, res) => {
  const body = req.body ?? {};
  if (!body.title?.trim()) return apiError(res, "Title is required", "VALIDATION_ERROR", 422);

  const tour = await prisma.tour.create({
    data: { title: body.title.trim(), description: body.description?.trim() || null, isPublished: !!body.isPublished },
  });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "tour", entityId: tour.id, changes: { title: tour.title }, ipAddress: getIp(req) });
  res.status(201).json({ tour });
});

toursRouter.get("/:id", requireAuth(), async (req, res) => {
  const tour = await prisma.tour.findUnique({ where: { id: intParam(req) }, include });
  if (!tour) return apiError(res, "Tour not found", "NOT_FOUND", 404);
  res.json({ tour });
});

/** Body: { title?, description?, isPublished?, stops?: [{ artefactId, note? }] } (stops replaces the ordered list) */
toursRouter.put("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const body = req.body;
  if (!body || typeof body !== "object") return apiError(res, "Invalid JSON", "BAD_REQUEST", 400);
  if (body.title !== undefined && !String(body.title).trim()) return apiError(res, "Title cannot be empty", "VALIDATION_ERROR", 422);

  const existing = await prisma.tour.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Tour not found", "NOT_FOUND", 404);

  const stops: { artefactId: number; note?: string }[] | undefined = Array.isArray(body.stops) ? body.stops : undefined;
  if (stops) {
    const seen = new Set<number>();
    for (const s of stops) {
      if (!Number.isInteger(s.artefactId) || seen.has(s.artefactId))
        return apiError(res, "Stops must be unique artefact ids", "VALIDATION_ERROR", 422);
      seen.add(s.artefactId);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.tour.update({
      where: { id: numId },
      data: {
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.isPublished !== undefined ? { isPublished: !!body.isPublished } : {}),
      },
    });
    if (stops) {
      await tx.tourStop.deleteMany({ where: { tourId: numId } });
      if (stops.length) {
        await tx.tourStop.createMany({
          data: stops.map((s, i) => ({ tourId: numId, artefactId: s.artefactId, position: i, note: s.note?.trim() || null })),
        });
      }
    }
  });

  await logAuditEvent({
    userId: req.user!.userId, action: "update", entityType: "tour", entityId: numId,
    changes: { ...body, stops: stops?.length }, ipAddress: getIp(req),
  });
  const tour = await prisma.tour.findUnique({ where: { id: numId }, include });
  res.json({ tour });
});

toursRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const existing = await prisma.tour.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Tour not found", "NOT_FOUND", 404);
  await prisma.tour.delete({ where: { id: numId } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "tour", entityId: numId, changes: { title: existing.title }, ipAddress: getIp(req) });
  res.json({ success: true });
});
