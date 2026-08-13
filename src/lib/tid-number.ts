import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Gera o próximo número sequencial de TID para uma unidade de origem de
 * forma atômica: o incremento é feito em uma única instrução UPDATE
 * (`lastTidNumber = lastTidNumber + 1`), o que evita corrida mesmo com
 * requisições concorrentes, tanto em SQLite quanto em PostgreSQL.
 * Deve ser chamado dentro de uma `prisma.$transaction`.
 */
export async function nextTidNumber(tx: Tx, originUnitId: string): Promise<number> {
  const updated = await tx.unit.update({
    where: { id: originUnitId },
    data: { lastTidNumber: { increment: 1 } },
    select: { lastTidNumber: true },
  });
  return updated.lastTidNumber;
}

/** Código curto e imutável da TID, ex.: "MKT-01", "194-01". */
export function buildTidLabel(originCode: string, number: number): string {
  const seq = String(number).padStart(2, "0");
  return `${originCode}-${seq}`;
}
