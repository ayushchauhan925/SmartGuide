import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, getIp } from "../middleware/auth";
import { logAuditEvent } from "../lib/audit";

const router = Router();

router.get("/", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { artefacts: true } } } });
  res.json({ categories });
});

router.post("/", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body ?? {};
  if (!name?.trim()) { res.status(422).json({ error: { message: "Name is required", code: "VALIDATION_ERROR" } }); return; }
  const category = await prisma.category.create({ data: { name: name.trim(), description: description?.trim() ?? null } });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "category", entityId: category.id, changes: { name }, ipAddress: getIp(req) });
  res.status(201).json({ category });
});

router.put("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const { name, description } = req.body ?? {};
  if (!name?.trim()) { res.status(422).json({ error: { message: "Name is required", code: "VALIDATION_ERROR" } }); return; }
  const category = await prisma.category.update({ where: { id }, data: { name: name.trim(), description: description?.trim() ?? null } });
  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "category", entityId: id, changes: { name }, ipAddress: getIp(req) });
  res.json({ category });
});

router.delete("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  await prisma.category.delete({ where: { id } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "category", entityId: id, ipAddress: getIp(req) });
  res.json({ success: true });
});

export default router;
