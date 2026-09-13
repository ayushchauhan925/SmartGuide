import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth(), async (req: AuthRequest, res: Response): Promise<void> => {
  const qrCodes = await prisma.qrCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { artefact: { select: { id: true, title: true, uniquePublicId: true, status: true } } },
  });
  res.json({ qrCodes });
});

export default router;
