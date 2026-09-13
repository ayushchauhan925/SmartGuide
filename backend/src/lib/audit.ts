import { prisma } from "./prisma";

interface AuditEvent {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: event.userId ?? null,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId?.toString() ?? null,
        changes: (event.changes as unknown as import("@prisma/client").Prisma.InputJsonValue) ?? undefined,
        ipAddress: event.ipAddress ?? null,
      },
    });
  } catch { /* non-critical */ }
}
