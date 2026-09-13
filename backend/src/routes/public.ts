import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/v1/public/a/:uniquePublicId — visitor page data
router.get("/a/:uniquePublicId", async (req: Request, res: Response): Promise<void> => {
  const { uniquePublicId } = req.params;

  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId },
    include: {
      category: { select: { id: true, name: true } },
      location: { select: { id: true, name: true, type: true, description: true } },
      images: { orderBy: { displayOrder: "asc" }, select: { id: true, imageUrl: true, altText: true, displayOrder: true } },
      audio: { select: { id: true, audioUrl: true, duration: true } },
    },
  });

  if (!artefact) {
    res.status(404).json({ error: { message: "Artefact not found", code: "NOT_FOUND" } });
    return;
  }

  if (artefact.status !== "active") {
    res.status(404).json({ error: { message: "Artefact not available", code: "NOT_FOUND" } });
    return;
  }

  // Increment view count if QR code exists
  await prisma.qrCode.updateMany({
    where: { artefactId: artefact.id, isActive: true },
    data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
  });

  res.json({ artefact });
});

export default router;
