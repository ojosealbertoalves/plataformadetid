import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { parseYearMonth, formatYearMonth } from "@/lib/month";
import { fromCents } from "@/lib/money";
import { TID_STATUS_LABELS, TID_TYPE_LABELS, type TidType, type TidStatus } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export interface ExportFilters {
  status?: string;
  type?: string;
  month?: string;
  unitId?: string;
  includeDeleted?: boolean;
}

export async function buildExportRows(filters: ExportFilters) {
  const where: Prisma.TidWhereInput = {};
  if (!filters.includeDeleted) where.isDeleted = false;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.month) where.referenceMonth = parseYearMonth(filters.month);
  if (filters.unitId) {
    where.OR = [{ originUnitId: filters.unitId }, { destUnitId: filters.unitId }];
  }

  const tids = await prisma.tid.findMany({
    where,
    include: {
      originUnit: { select: { code: true, name: true } },
      destUnit: { select: { code: true, name: true } },
      createdBy: { select: { name: true, login: true } },
      items: { include: { obraUau: { select: { code: true, name: true } } } },
    },
    orderBy: [{ originUnit: { code: "asc" } }, { number: "asc" }],
  });

  const rows: Record<string, unknown>[] = [];

  for (const tid of tids) {
    for (const item of tid.items) {
      rows.push({
        "TID": tid.label,
        "Numero": tid.number,
        "Tipo": tid.type,
        "Tipo (descrição)": TID_TYPE_LABELS[tid.type as TidType] ?? tid.type,
        "Origem (código)": tid.originUnit.code,
        "Origem (nome)": tid.originUnit.name,
        "Destino (código)": tid.destUnit.code,
        "Destino (nome)": tid.destUnit.name,
        "Mês Referência": formatYearMonth(tid.referenceMonth),
        "Status": TID_STATUS_LABELS[tid.status as TidStatus] ?? tid.status,
        "Criado por": tid.createdBy.name,
        "Criado em": tid.createdAt.toISOString(),
        "Aprovado em": tid.approvedAt ? tid.approvedAt.toISOString() : "",
        "Excluído": tid.isDeleted ? "Sim" : "Não",
        "Item - Observação": item.observacao ?? "",
        "Item - Nome/Item": item.item ?? item.funcionario ?? "",
        "Item - Função": item.funcao ?? "",
        "Item - Centro de Custo": item.centroCusto ?? "",
        "Item - Local de Origem": item.localOrigem ?? "",
        "Item - Local de Trabalho/Utilização": item.localTrabalho ?? item.localUtilizacao ?? "",
        "Item - Obra UAU": item.obraUau ? `${item.obraUau.code} - ${item.obraUau.name}` : "",
        "Item - Proc UAU": item.procUau ?? "",
        "Item - Fornecedor": item.fornecedor ?? "",
        "Item - Doc Fiscal": item.docFiscal ?? "",
        "Item - Mês Referência (item)": item.mesReferencia
          ? formatYearMonth(item.mesReferencia)
          : "",
        "Item - Qtde Dias": item.qtdeDias ?? "",
        "Item - Quantidade": item.quantidade ?? "",
        "Item - Valor Folha": item.valorFolhaCents !== null ? fromCents(item.valorFolhaCents) : "",
        "Item - Valor NF": item.valorNfCents !== null ? fromCents(item.valorNfCents) : "",
        "Item - Valor Unit. Original":
          item.valorUnitOriginalCents !== null ? fromCents(item.valorUnitOriginalCents) : "",
        "Item - Valor Depreciação":
          item.valorDepreciacaoCents !== null ? fromCents(item.valorDepreciacaoCents) : "",
        "Item - Encargos 80%":
          item.encargos80Cents !== null ? fromCents(item.encargos80Cents) : "",
        "Item - Total Geral":
          item.totalGeralCents !== null ? fromCents(item.totalGeralCents) : "",
        "Item - Valor TID": fromCents(item.valorTidCents),
      });
    }
  }

  return rows;
}

export function rowsToXlsxBuffer(rows: Record<string, unknown>[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "TIDs");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet);
}

export function rowsToTxt(rows: Record<string, unknown>[]): string {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet, { FS: "\t" });
}
