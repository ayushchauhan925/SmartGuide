import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, requireAuth } from "../lib/http.js";
import { logAuditEvent } from "../lib/audit.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", requireAuth(), async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

categoriesRouter.post("/", requireAuth(UserRole.editor), async (req, res) => {
  const body = (req.body ?? {}) as { name?: string; description?: string };
  if (!body.name?.trim()) return apiError(res, "Name is required", "VALIDATION_ERROR", 422);

  const existing = await prisma.category.findUnique({ where: { name: body.name.trim() } });
  if (existing) return apiError(res, "Category already exists", "CONFLICT", 409);

  const category = await prisma.category.create({
    data: { name: body.name.trim(), description: body.description?.trim() ?? null },
  });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "category", entityId: category.id, ipAddress: getIp(req) });
  res.status(201).json({ category });
});

categoriesRouter.put("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const body = (req.body ?? {}) as { name?: string; description?: string };

  const existing = await prisma.category.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Category not found", "NOT_FOUND", 404);

  const category = await prisma.category.update({
    where: { id: numId },
    data: {
      ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
    },
  });
  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "category", entityId: numId, ipAddress: getIp(req) });
  res.json({ category });
});

categoriesRouter.delete("/:id", requireAuth(UserRole.editor), async (req, res) => {
  const numId = intParam(req);
  const existing = await prisma.category.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "Category not found", "NOT_FOUND", 404);

  await prisma.category.delete({ where: { id: numId } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "category", entityId: numId, ipAddress: getIp(req) });
  res.json({ success: true });
});
