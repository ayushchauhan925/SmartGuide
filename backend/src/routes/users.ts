import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, getIp } from "../middleware/auth";
import { hashPassword } from "../lib/auth";
import { logAuditEvent } from "../lib/audit";

const router = Router();

router.get("/", requireAuth("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
  res.json({ users });
});

router.post("/", requireAuth("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role = "viewer" } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) { res.status(422).json({ error: { message: "Name, email and password are required", code: "VALIDATION_ERROR" } }); return; }
  if (password.length < 8) { res.status(422).json({ error: { message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" } }); return; }
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) { res.status(409).json({ error: { message: "Email already in use", code: "CONFLICT" } }); return; }
  const user = await prisma.user.create({ data: { name: name.trim(), email: email.toLowerCase(), passwordHash: await hashPassword(password), role }, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "user", entityId: user.id, changes: { name, email, role }, ipAddress: getIp(req) });
  res.status(201).json({ user });
});

router.put("/:id", requireAuth("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const { name, role, password } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (name?.trim()) data.name = name.trim();
  if (role) data.role = role;
  if (password) { if (password.length < 8) { res.status(422).json({ error: { message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" } }); return; } data.passwordHash = await hashPassword(password); }
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "user", entityId: id, changes: { name, role }, ipAddress: getIp(req) });
  res.json({ user });
});

router.delete("/:id", requireAuth("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  if (id === req.user!.userId) { res.status(400).json({ error: { message: "Cannot deactivate yourself", code: "VALIDATION_ERROR" } }); return; }
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await logAuditEvent({ userId: req.user!.userId, action: "deactivate", entityType: "user", entityId: id, ipAddress: getIp(req) });
  res.json({ success: true });
});

export default router;
