import { Router } from "express";
import path from "path";
import fs from "fs";
import { apiError } from "../lib/http.js";

export const filesRouter = Router();

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

/** Serves uploaded media. Supports Range requests so audio can seek. */
filesRouter.get("/*path", (req, res) => {
  const segments = (req.params as { path: string[] }).path;
  const filePath = path.resolve(UPLOAD_DIR, ...segments);
  // Prevent path traversal
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return apiError(res, "Forbidden", "FORBIDDEN", 403);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return apiError(res, "File not found", "NOT_FOUND", 404);

  res.sendFile(filePath, {
    headers: { "Content-Type": MIME_MAP[path.extname(filePath).toLowerCase()] ?? "application/octet-stream" },
    maxAge: "365d",
    immutable: true,
  });
});
