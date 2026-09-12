import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const qrCodes = await prisma.qrCode.findMany({
      include: {
        artefact: {
          select: { title: true, uniquePublicId: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ qrCodes });
  } catch {
    return apiError("Failed to fetch QR codes", "INTERNAL_ERROR", 500);
  }
}
