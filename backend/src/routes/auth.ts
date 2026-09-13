import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, signToken, setSessionCookie, clearSessionCookie, getTokenFromRequest, verifyToken } from "../lib/auth";
import { requireAuth, AuthRequest, getIp } from "../middleware/auth";
import { logAuditEvent } from "../lib/audit";

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: { message: "Too many login attempts", code: "RATE_LIMITED" } } });

// POST /api/v1/auth — login
router.post("/", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) { res.status(400).json({ error: { message: "Email and password required", code: "VALIDATION_ERROR" } }); return; }
  if (typeof email !== "string" || typeof password !== "string") { res.status(400).json({ error: { message: "Email and password required", code: "VALIDATION_ERROR" } }); return; }
  if (email.length > 254 || password.length > 128) { res.status(400).json({ error: { message: "Email and password required", code: "VALIDATION_ERROR" } }); return; }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.isActive) { res.status(401).json({ error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }); return; }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }); return; }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setSessionCookie(res, token);

  await logAuditEvent({ userId: user.id, action: "login", entityType: "user", entityId: user.id, ipAddress: getIp(req) });

  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/v1/auth/me
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) { res.status(401).json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: { message: "Invalid session", code: "UNAUTHORIZED" } }); return; }
  const user = await prisma.user.findUnique({ where: { id: payload.userId, isActive: true }, select: { id: true, name: true, email: true, role: true } });
  if (!user) { res.status(401).json({ error: { message: "User not found", code: "UNAUTHORIZED" } }); return; }
  res.json({ user });
});

// POST /api/v1/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

export default router;
