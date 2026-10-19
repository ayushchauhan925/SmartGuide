import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  changes,
  ipAddress,
}: {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: string | number;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId?.toString() ?? null,
        changes: (changes ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch {
    // Audit logging failures should not break app flow
    console.error("Audit log failed:", action, entityType, entityId);
  }
}
