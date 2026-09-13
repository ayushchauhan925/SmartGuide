import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve("./uploads");

// GET /uploads/:subDir/:filename — serve uploaded files
router.get("/:subDir/:filename", (req: Request, res: Response): void => {
  const { subDir, filename } = req.params;

  // Prevent path traversal
  const safeSub = path.basename(subDir);
  const safeFile = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeSub, safeFile);

  if (!filePath.startsWith(UPLOAD_DIR)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendFile(filePath);
});

export default router;
