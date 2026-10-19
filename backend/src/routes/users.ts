import { Router } from "express";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, intParam, requireAuth } from "../lib/http.js";
import { hashPassword } from "../lib/auth.js";
import { logAuditEvent } from "../lib/audit.js";

export const usersRouter = Router();

const PUBLIC_FIELDS = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } as const;

usersRouter.get("/", requireAuth(UserRole.admin), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: PUBLIC_FIELDS });
  res.json({ users });
});

usersRouter.post("/", requireAuth(UserRole.admin), async (req, res) => {
  const body = (req.body ?? {}) as { name?: string; email?: string; password?: string; role?: string };
  if (!body.name?.trim()) return apiError(res, "Name is required", "VALIDATION_ERROR", 422);
  if (!body.email?.trim()) return apiError(res, "Email is required", "VALIDATION_ERROR", 422);
  if (!body.password || body.password.length < 8) return apiError(res, "Password must be at least 8 characters", "VALIDATION_ERROR", 422);

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (existing) return apiError(res, "Email already in use", "CONFLICT", 409);

  const newUser = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      passwordHash: await hashPassword(body.password),
      role: (body.role as UserRole) ?? UserRole.viewer,
    },
    select: PUBLIC_FIELDS,
  });
  await logAuditEvent({ userId: req.user!.userId, action: "create_user", entityType: "user", entityId: newUser.id, ipAddress: getIp(req) });
  res.status(201).json({ user: newUser });
});

usersRouter.put("/:id", requireAuth(UserRole.admin), async (req, res) => {
  const numId = intParam(req);
  const body = (req.body ?? {}) as { name?: string; role?: string; isActive?: boolean; password?: string };

  const existing = await prisma.user.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "User not found", "NOT_FOUND", 404);

  const data: Prisma.UserUpdateInput = {};
  if (body.name?.trim()) data.name = body.name.trim();
  if (body.role) data.role = body.role as UserRole;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) {
    if (body.password.length < 8) return apiError(res, "Password must be at least 8 characters", "VALIDATION_ERROR", 422);
    data.passwordHash = await hashPassword(body.password);
  }

  const updated = await prisma.user.update({ where: { id: numId }, data, select: PUBLIC_FIELDS });
  await logAuditEvent({ userId: req.user!.userId, action: "update_user", entityType: "user", entityId: numId, ipAddress: getIp(req) });
  res.json({ user: updated });
});

usersRouter.delete("/:id", requireAuth(UserRole.admin), async (req, res) => {
  const numId = intParam(req);
  if (req.user!.userId === numId) return apiError(res, "Cannot delete your own account", "FORBIDDEN", 403);

  const existing = await prisma.user.findUnique({ where: { id: numId } });
  if (!existing) return apiError(res, "User not found", "NOT_FOUND", 404);

  await prisma.user.update({ where: { id: numId }, data: { isActive: false } });
  await logAuditEvent({ userId: req.user!.userId, action: "deactivate_user", entityType: "user", entityId: numId, ipAddress: getIp(req) });
  res.json({ success: true });
});
