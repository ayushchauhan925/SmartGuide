import { Router } from "express";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { apiError, query, requireAuth } from "../lib/http.js";

export const qrCodesRouter = Router();

qrCodesRouter.get("/", requireAuth(), async (_req, res) => {
  try {
    const qrCodes = await prisma.qrCode.findMany({
      include: { artefact: { select: { title: true, uniquePublicId: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ qrCodes });
  } catch {
    apiError(res, "Failed to fetch QR codes", "INTERNAL_ERROR", 500);
  }
});

/** SVG QR codes for printing. Query: ids=1,2,3 (artefact ids). Omit for all active artefacts. */
qrCodesRouter.get("/sheet", requireAuth(), async (req, res) => {
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  const ids = query(req, "ids")?.split(",").map((x) => parseInt(x)).filter(Number.isFinite);

  const artefacts = await prisma.artefact.findMany({
    where: ids?.length ? { id: { in: ids } } : { status: "active" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, uniquePublicId: true, location: { select: { name: true } } },
    take: 500,
  });

  const items = await Promise.all(
    artefacts.map(async (a) => {
      const url = `${appUrl}/a/${a.uniquePublicId}`;
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { id: a.id, title: a.title, location: a.location?.name ?? null, url, svg };
    })
  );
  res.json({ items });
});
