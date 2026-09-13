import { Request, Response, NextFunction } from "express";
import { verifyToken, getTokenFromRequest, JwtPayload } from "../lib/auth";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const ROLE_HIERARCHY: Record<string, number> = { viewer: 0, editor: 1, admin: 2 };

export function requireAuth(minRole?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = getTokenFromRequest(req);
    if (!token) { res.status(401).json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }); return; }

    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: { message: "Invalid session", code: "UNAUTHORIZED" } }); return; }

    // Verify user is still active
    const user = await prisma.user.findUnique({ where: { id: payload.userId, isActive: true }, select: { id: true } });
    if (!user) { res.status(401).json({ error: { message: "User not found", code: "UNAUTHORIZED" } }); return; }

    if (minRole) {
      const userLevel = ROLE_HIERARCHY[payload.role] ?? -1;
      const requiredLevel = ROLE_HIERARCHY[minRole] ?? 99;
      if (userLevel < requiredLevel) {
        res.status(403).json({ error: { message: "Forbidden", code: "FORBIDDEN" } });
        return;
      }
    }

    req.user = payload;
    next();
  };
}

export function getIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}
