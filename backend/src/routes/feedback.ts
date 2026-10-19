import { Router } from "express";
import { FeedbackStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, query, requireAuth } from "../lib/http.js";
import { logAuditEvent } from "../lib/audit.js";

export const feedbackRouter = Router();

feedbackRouter.get("/", requireAuth(), async (req, res) => {
  const status = query(req, "status");
  const page = Math.max(1, parseInt(query(req, "page") ?? "1") || 1);
  const limit = 20;
  const where: Prisma.FeedbackWhereInput = status && status in FeedbackStatus ? { status: status as FeedbackStatus } : {};

  const [items, total, pending] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { artefact: { select: { id: true, title: true } } },
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { status: "pending" } }),
  ]);
  res.json({ items, total, pending, pages: Math.ceil(total / limit) });
});

feedbackRouter.patch("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  const status = req.body?.status;
  if (!(status in FeedbackStatus)) return apiError(res, "Invalid status", "VALIDATION_ERROR", 422);
  const item = await prisma.feedback.update({ where: { id }, data: { status } }).catch(() => null);
  if (!item) return apiError(res, "Feedback not found", "NOT_FOUND", 404);
  await logAuditEvent({ userId: req.user!.userId, action: "moderate", entityType: "feedback", entityId: id, changes: { status }, ipAddress: getIp(req) });
  res.json({ item });
});

feedbackRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const id = intParam(req);
  await prisma.feedback.deleteMany({ where: { id } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "feedback", entityId: id, ipAddress: getIp(req) });
  res.json({ success: true });
});
