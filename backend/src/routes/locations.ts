import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, requireAuth } from "../lib/http.js";
import { logAuditEvent } from "../lib/audit.js";
import { storage, validateImageFile } from "../lib/storage.js";
import { optimizeImage } from "../lib/image.js";
import { upload } from "../lib/upload.js";

export const locationsRouter = Router();

locationsRouter.get("/", requireAuth(), async (_req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  res.json({ locations });
});

locationsRouter.post("/", requireAuth(UserRole.editor), async (req, res) => {
  const body = (req.body ?? {}) as { name?: string; type?: string; description?: string };
  if (!body.name?.trim()) return apiError(res, "Name is required", "VALIDATION_ERROR", 422);

  const location = await prisma.location.create({
    data: {
      name: body.name.trim(),
      type: body.type?.trim() ?? null,
      description: body.description?.trim() ?? null,
    },
  });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "location", entityId: location.id, ipAddress: getIp(req) });
  res.status(201).json({ location });
});

locationsRouter.put("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const body = (req.body ?? {}) as { name?: string; type?: string | null; description?: string | null };

  const existing = await prisma.location.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Location not found", "NOT_FOUND", 404);

  const location = await prisma.location.update({
    where: { id: numId },
    data: {
      ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      ...(body.type !== undefined ? { type: body.type?.trim() || null } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    },
  });
  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "location", entityId: numId, ipAddress: getIp(req) });
  res.json({ location });
});

locationsRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const existing = await prisma.location.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Location not found", "NOT_FOUND", 404);

  await prisma.location.delete({ where: { id: numId } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "location", entityId: numId, ipAddress: getIp(req) });
  res.json({ success: true });
});

/** Multipart field "image": uploads (or replaces) the location's floor plan. */
locationsRouter.post("/:id/floor-plan", requireAuth(UserRole.editor), upload.single("image"), async (req, res) => {
  const id = intParam(req);
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) return apiError(res, "Location not found", "NOT_FOUND", 404);

  const file = req.file;
  if (!file) return apiError(res, "No image provided", "VALIDATION_ERROR", 422);
  const invalid = validateImageFile(file.mimetype, file.size);
  if (invalid) return apiError(res, invalid, "VALIDATION_ERROR", 422);

  let optimized;
  try {
    optimized = await optimizeImage(file.buffer, file.originalname);
  } catch {
    return apiError(res, "File is not a valid image", "VALIDATION_ERROR", 422);
  }
  const { url } = await storage.save(optimized.buffer, optimized.filename, "floor-plans");

  const updated = await prisma.location.update({ where: { id }, data: { floorPlanUrl: url } });
  await logAuditEvent({ userId: req.user!.userId, action: "upload_floor_plan", entityType: "location", entityId: id, ipAddress: getIp(req) });
  res.json({ location: updated });
});

locationsRouter.delete("/:id/floor-plan", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const updated = await prisma.location.update({ where: { id }, data: { floorPlanUrl: null } }).catch(() => null);
  if (!updated) return apiError(res, "Location not found", "NOT_FOUND", 404);
  res.json({ location: updated });
});
