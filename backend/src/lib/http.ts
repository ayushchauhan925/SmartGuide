import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { COOKIE_NAME, verifyToken, type JwtPayload } from "./auth.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function apiError(res: Response, message: string, code: string, status: number) {
  return res.status(status).json({ error: { message, code } });
}

const ROLE_HIERARCHY: Record<string, number> = { viewer: 0, editor: 1, admin: 2 };

export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 99);
}

/** Requires a valid session cookie (and optionally a minimum role); sets req.user. */
export function requireAuth(minRole?: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[COOKIE_NAME];
    const session = token ? verifyToken(token) : null;
    if (!session) return apiError(res, "Unauthorized", "UNAUTHORIZED", 401);
    if (minRole && !hasRole(session.role, minRole)) return apiError(res, "Forbidden", "FORBIDDEN", 403);
    req.user = session;
    next();
  };
}

export function getIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first || (req.headers["x-real-ip"] as string | undefined) || req.socket.remoteAddress || "unknown";
}

/** Integer route param, or NaN. */
export function intParam(req: Request, name = "id"): number {
  return parseInt(String(req.params[name]), 10);
}

export function query(req: Request, name: string): string | undefined {
  const v = req.query[name];
  return typeof v === "string" ? v : undefined;
}
