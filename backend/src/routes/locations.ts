import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, getIp } from "../middleware/auth";
import { logAuditEvent } from "../lib/audit";

const router = Router();

router.get("/", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { artefacts: true } } } });
  res.json({ locations });
});

router.post("/", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, description } = req.body ?? {};
  if (!name?.trim()) { res.status(422).json({ error: { message: "Name is required", code: "VALIDATION_ERROR" } }); return; }
  const location = await prisma.location.create({ data: { name: name.trim(), type: type?.trim() ?? null, description: description?.trim() ?? null } });
  await logAuditEvent({ userId: req.user!.userId, action: "create", entityType: "location", entityId: location.id, changes: { name }, ipAddress: getIp(req) });
  res.status(201).json({ location });
});

router.put("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const { name, type, description } = req.body ?? {};
  if (!name?.trim()) { res.status(422).json({ error: { message: "Name is required", code: "VALIDATION_ERROR" } }); return; }
  const location = await prisma.location.update({ where: { id }, data: { name: name.trim(), type: type?.trim() ?? null, description: description?.trim() ?? null } });
  await logAuditEvent({ userId: req.user!.userId, action: "update", entityType: "location", entityId: id, changes: { name }, ipAddress: getIp(req) });
  res.json({ location });
});

router.delete("/:id", requireAuth("editor"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  await prisma.location.delete({ where: { id } });
  await logAuditEvent({ userId: req.user!.userId, action: "delete", entityType: "location", entityId: id, ipAddress: getIp(req) });
  res.json({ success: true });
});

export default router;
