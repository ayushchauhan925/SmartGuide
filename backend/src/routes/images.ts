import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, requireAuth } from "../lib/http.js";
import { storage } from "../lib/storage.js";
import { logAuditEvent } from "../lib/audit.js";

export const imagesRouter = Router();

imagesRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const image = await prisma.artefactImage.findUnique({ where: { id: numId } });
  if (!image) return apiError(res, "Image not found", "NOT_FOUND", 404);

  await storage.delete(image.storagePath);
  await prisma.artefactImage.delete({ where: { id: numId } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete_image", entityType: "artefact_image", entityId: numId, ipAddress: getIp(req) });
  res.json({ success: true });
});

imagesRouter.patch("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const body = (req.body ?? {}) as { displayOrder?: number; altText?: string };
  const image = await prisma.artefactImage.update({
    where: { id: numId },
    data: {
      ...(body.displayOrder !== undefined ? { displayOrder: body.displayOrder } : {}),
      ...(body.altText !== undefined ? { altText: body.altText } : {}),
    },
  });
  res.json({ image });
});
