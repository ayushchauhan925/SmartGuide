import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { query, requireAuth } from "../lib/http.js";

export const auditLogsRouter = Router();

auditLogsRouter.get("/", requireAuth(), async (req, res) => {
  const entityType = query(req, "entityType") || undefined;
  const search = query(req, "search") ?? "";
  const page = Math.max(1, parseInt(query(req, "page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query(req, "limit") ?? "20") || 20));

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(search ? { action: { contains: search } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
});
