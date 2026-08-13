import type { TidType } from "./constants";

export type FieldKind = "text" | "textarea" | "number" | "int" | "money" | "month" | "obra-uau";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Campo calculado no servidor — exibido como somente-leitura, com preview no cliente. */
  computed?: boolean;
  colSpan?: 1 | 2 | 3;
}

export type FieldGroup = "AB" | "CD" | "EF";

export function groupForType(type: TidType): FieldGroup {
  if (type === "A" || type === "B") return "AB";
  if (type === "C" || type === "D") return "CD";
  return "EF";
}

const AB_FIELDS: FieldDef[] = [
  { key: "funcionario", label: "Funcionário", kind: "text", required: true, colSpan: 2 },
  { key: "mesReferencia", label: "Mês Referência", kind: "month", required: true },
  { key: "funcao", label: "Função", kind: "text" },
  { key: "centroCusto", label: "Centro de Custo", kind: "text" },
  { key: "localOrigem", label: "Local de Origem", kind: "text" },
  { key: "localTrabalho", label: "Local de Trabalho", kind: "text" },
  { key: "qtdeDias", label: "Qtde Dias", kind: "int" },
  { key: "valorFolha", label: "Valor da Folha", kind: "money" },
  { key: "valorTid", label: "Valor TID", kind: "money", required: true },
  { key: "encargos80", label: "Encargos 80%", kind: "money", computed: true },
  { key: "totalGeral", label: "Total Geral", kind: "money", computed: true },
  { key: "observacao", label: "Observação", kind: "textarea", colSpan: 3 },
];

const CD_FIELDS: FieldDef[] = [
  { key: "item", label: "Item", kind: "text", colSpan: 2 },
  { key: "centroCusto", label: "Centro de Custo", kind: "text" },
  { key: "localOrigem", label: "Local de Origem", kind: "text" },
  { key: "localUtilizacao", label: "Local de Utilização", kind: "text" },
  { key: "obraUauId", label: "Obra UAU", kind: "obra-uau", required: true },
  { key: "procUau", label: "Proc UAU", kind: "text" },
  { key: "fornecedor", label: "Fornecedor", kind: "text" },
  { key: "docFiscal", label: "Doc Fiscal", kind: "text" },
  { key: "valorNf", label: "Valor NF", kind: "money" },
  { key: "valorTid", label: "Valor TID", kind: "money", required: true },
  { key: "observacao", label: "Observação", kind: "textarea", colSpan: 3 },
];

const EF_FIELDS: FieldDef[] = [
  { key: "item", label: "Item", kind: "text", colSpan: 2 },
  { key: "centroCusto", label: "Centro de Custo", kind: "text" },
  { key: "localOrigem", label: "Local de Origem", kind: "text" },
  { key: "localUtilizacao", label: "Local de Utilização", kind: "text" },
  { key: "obraUauId", label: "Obra UAU", kind: "obra-uau", required: true },
  { key: "procUau", label: "Proc UAU", kind: "text" },
  { key: "fornecedor", label: "Fornecedor", kind: "text" },
  { key: "docFiscal", label: "Doc Fiscal", kind: "text" },
  { key: "quantidade", label: "Quantidade", kind: "number", required: true },
  { key: "valorUnitOriginal", label: "Valor Unit. Original", kind: "money", required: true },
  { key: "valorDepreciacao", label: "Valor da Depreciação", kind: "money", required: true },
  { key: "valorTid", label: "Valor TID", kind: "money", computed: true },
  { key: "observacao", label: "Observação", kind: "textarea", colSpan: 3 },
];

export const FIELDS_BY_GROUP: Record<FieldGroup, FieldDef[]> = {
  AB: AB_FIELDS,
  CD: CD_FIELDS,
  EF: EF_FIELDS,
};

export function emptyItem(): Record<string, string> {
  return {};
}

/** Converte o estado (strings) do formulário no payload esperado pela API (números). */
export function serializeItem(group: FieldGroup, item: Record<string, string>): Record<string, unknown> {
  const fields = FIELDS_BY_GROUP[group];
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.computed) continue;
    const raw = item[field.key];
    if (raw === undefined || raw === "") continue;
    if (field.kind === "money" || field.kind === "number") {
      out[field.key] = parseFloat(raw.replace(",", "."));
    } else if (field.kind === "int") {
      out[field.key] = parseInt(raw, 10);
    } else {
      out[field.key] = raw;
    }
  }
  return out;
}

/** Converte um TidItem persistido (centavos) de volta para o estado (strings) do formulário. */
export function itemToFormState(
  group: FieldGroup,
  item: Record<string, unknown>
): Record<string, string> {
  const fields = FIELDS_BY_GROUP[group];
  const out: Record<string, string> = {};
  for (const field of fields) {
    if (field.computed) continue;
    if (field.kind === "money") {
      const cents = item[`${field.key}Cents`];
      if (typeof cents === "number") out[field.key] = (cents / 100).toString();
      continue;
    }
    if (field.kind === "month") {
      const date = item[field.key];
      if (date instanceof Date) {
        out[field.key] = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      }
      continue;
    }
    if (field.key === "obraUauId") {
      const obraUau = item.obraUau as { id?: string } | null | undefined;
      out[field.key] = (item.obraUauId as string) ?? obraUau?.id ?? "";
      continue;
    }
    const value = item[field.key];
    if (value !== null && value !== undefined) out[field.key] = String(value);
  }
  return out;
}

/** Calcula os campos derivados (preview no cliente — o servidor recalcula tudo de novo). */
export function computePreview(group: FieldGroup, item: Record<string, string>) {
  if (group === "AB") {
    const valorTid = parseFloat(item.valorTid?.replace(",", ".") || "0") || 0;
    const encargos80 = Math.round(valorTid * 0.8 * 100) / 100;
    const totalGeral = Math.round((valorTid + encargos80) * 100) / 100;
    return { encargos80, totalGeral };
  }
  if (group === "EF") {
    const quantidade = parseFloat(item.quantidade?.replace(",", ".") || "0") || 0;
    const unit = parseFloat(item.valorUnitOriginal?.replace(",", ".") || "0") || 0;
    const dep = parseFloat(item.valorDepreciacao?.replace(",", ".") || "0") || 0;
    const valorTid = Math.round(quantidade * (unit - dep) * 100) / 100;
    return { valorTid };
  }
  return {};
}
