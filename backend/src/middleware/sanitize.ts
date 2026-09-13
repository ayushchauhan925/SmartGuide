import { Request, Response, NextFunction } from "express";

// Recursively check for MongoDB operator injection keys (e.g. {"$gt": ""})
function hasInjectionKeys(obj: unknown, depth = 0): boolean {
  if (depth > 10) return false;
  if (obj === null || typeof obj !== "object") return false;
  for (const key of Object.keys(obj as object)) {
    if (key.startsWith("$")) return true;
    if (hasInjectionKeys((obj as Record<string, unknown>)[key], depth + 1)) return true;
  }
  return false;
}

export function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && hasInjectionKeys(req.body)) {
    res.status(400).json({ error: { message: "Invalid request", code: "VALIDATION_ERROR" } });
    return;
  }
  next();
}
