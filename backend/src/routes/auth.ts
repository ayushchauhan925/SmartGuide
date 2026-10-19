import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyPassword, signToken, sessionCookieOptions, clearCookieOptions, COOKIE_NAME } from "../lib/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { apiError, getIp, requireAuth } from "../lib/http.js";

export const authRouter = Router();

authRouter.post("/", async (req, res) => {
  if (!rateLimit(`login:${getIp(req)}`, 10, 15 * 60 * 1000)) {
    return apiError(res, "Too many login attempts. Try again in 15 minutes.", "RATE_LIMITED", 429);
  }

  const { email, password, remember = false } = (req.body ?? {}) as { email?: string; password?: string; remember?: boolean };
  if (!email || !password) return apiError(res, "Email and password are required", "VALIDATION_ERROR", 422);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return apiError(res, "Invalid email or password", "INVALID_CREDENTIALS", 401);
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.cookie(COOKIE_NAME, token, sessionCookieOptions(remember));
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.get("/me", requireAuth(), async (req, res) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.userId, isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!dbUser) return apiError(res, "User not found", "NOT_FOUND", 404);
  res.json({ user: dbUser });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, clearCookieOptions());
  res.json({ success: true });
});
