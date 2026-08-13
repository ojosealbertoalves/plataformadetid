import type { Prisma, PrismaClient } from "@prisma/client";
import type { AuditAction } from "./constants";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function writeAuditLog(
  tx: Tx,
  params: {
    entity: string;
    entityId: string;
    action: AuditAction;
    actorId: string;
    before?: unknown;
    after?: unknown;
  }
) {
  await tx.auditLog.create({
    data: {
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      actorId: params.actorId,
      before: params.before !== undefined ? JSON.stringify(params.before) : null,
      after: params.after !== undefined ? JSON.stringify(params.after) : null,
    },
  });
}
