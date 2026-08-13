import { prisma } from "@/lib/prisma";
import { parseYearMonth } from "@/lib/month";
import { TID_TYPES, type TidType } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export interface SummaryRow {
  unitId: string;
  unitCode: string;
  unitName: string;
  unitKind: string;
  byType: Record<TidType, number>; // saldo líquido em centavos
  total: number;
}

/**
 * Matriz de saldo líquido: uma linha por unidade, uma coluna por tipo de TID.
 * Saldo = valor creditado (unidade como origem) − valor debitado (unidade como destino).
 * Considera apenas TIDs APROVADAS e não excluídas.
 */
export async function computeSummaryMatrix(month?: string): Promise<SummaryRow[]> {
  const where: Prisma.TidWhereInput = {
    status: "APROVADA",
    isDeleted: false,
    ...(month ? { referenceMonth: parseYearMonth(month) } : {}),
  };

  const [tids, units] = await Promise.all([
    prisma.tid.findMany({
      where,
      select: {
        id: true,
        type: true,
        originUnitId: true,
        destUnitId: true,
        items: { select: { valorTidCents: true } },
      },
    }),
    prisma.unit.findMany({
      where: { ativo: true },
      select: { id: true, code: true, name: true, kind: true },
      orderBy: [{ kind: "asc" }, { code: "asc" }],
    }),
  ]);

  const balances = new Map<string, Record<TidType, number>>();
  const emptyByType = (): Record<TidType, number> =>
    Object.fromEntries(TID_TYPES.map((t) => [t, 0])) as Record<TidType, number>;

  for (const unit of units) {
    balances.set(unit.id, emptyByType());
  }

  for (const tid of tids) {
    const value = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
    const type = tid.type as TidType;

    const originRow = balances.get(tid.originUnitId);
    if (originRow) originRow[type] += value;

    const destRow = balances.get(tid.destUnitId);
    if (destRow) destRow[type] -= value;
  }

  return units.map((unit) => {
    const byType = balances.get(unit.id)!;
    const total = TID_TYPES.reduce((acc, t) => acc + byType[t], 0);
    return {
      unitId: unit.id,
      unitCode: unit.code,
      unitName: unit.name,
      unitKind: unit.kind,
      byType,
      total,
    };
  });
}

export interface DrilldownEntry {
  tidId: string;
  label: string;
  documentLabel: string;
  originCode: string;
  destCode: string;
  referenceMonth: string;
  valueCents: number; // com sinal: crédito positivo, débito negativo
  role: "credito" | "debito";
}

/** Lista as TIDs que compõem o saldo de uma célula (unidade x tipo) da matriz. */
export async function computeDrilldown(
  unitId: string,
  type: TidType,
  month?: string
): Promise<DrilldownEntry[]> {
  const where: Prisma.TidWhereInput = {
    status: "APROVADA",
    isDeleted: false,
    type,
    ...(month ? { referenceMonth: parseYearMonth(month) } : {}),
    OR: [{ originUnitId: unitId }, { destUnitId: unitId }],
  };

  const tids = await prisma.tid.findMany({
    where,
    include: {
      originUnit: { select: { code: true } },
      destUnit: { select: { code: true } },
      items: { select: { valorTidCents: true } },
    },
    orderBy: { referenceMonth: "desc" },
  });

  return tids.map((tid) => {
    const value = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
    const isOrigin = tid.originUnitId === unitId;
    return {
      tidId: tid.id,
      label: tid.label,
      documentLabel: `TID ${tid.number} — ${tid.originUnit.code} → ${tid.destUnit.code}`,
      originCode: tid.originUnit.code,
      destCode: tid.destUnit.code,
      referenceMonth: tid.referenceMonth.toISOString().slice(0, 7),
      valueCents: isOrigin ? value : -value,
      role: isOrigin ? "credito" : "debito",
    };
  });
}
