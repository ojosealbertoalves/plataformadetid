export const ROLES = ["ADMIN", "GERENTE_OBRA", "UNIDADE"] as const;
export type Role = (typeof ROLES)[number];

export const UNIT_KINDS = ["DEPARTMENT", "WORK"] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const TID_TYPES = ["A", "B", "C", "D", "E", "F"] as const;
export type TidType = (typeof TID_TYPES)[number];

export const TID_STATUSES = ["PENDENTE", "APROVADA", "RECUSADA"] as const;
export type TidStatus = (typeof TID_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const TID_TYPE_LABELS: Record<TidType, string> = {
  A: "Encargos Diretos da Folha",
  B: "Encargos Indiretos da Folha",
  C: "Despesas Indiretas",
  D: "Serviços de Terceiros",
  E: "Equipamentos",
  F: "Materiais",
};

/** Rótulos curtos usados como cabeçalho das colunas na matriz-resumo do admin. */
export const TID_TYPE_SHORT_LABELS: Record<TidType, string> = {
  A: "Mão-de-obra Direta",
  B: "Encargos Sociais Diretos",
  C: "Indiretas",
  D: "Serv. Terc.",
  E: "Equipamento",
  F: "Material",
};

export const TID_STATUS_LABELS: Record<TidStatus, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
};

/** Tipos que têm o campo "Mês Referência" por item (define o mês da TID). */
export const TYPES_WITH_ITEM_LEVEL_MONTH: TidType[] = ["A", "B"];

/** Tipos que usam o dropdown "Obra UAU" como classificação do item. */
export const TYPES_WITH_OBRA_UAU: TidType[] = ["C", "D", "E", "F"];

/** Tipos cujo Valor TID é calculado no servidor (não informado pelo usuário). */
export const TYPES_WITH_CALCULATED_VALUE: TidType[] = ["E", "F"];

export const ENCARGOS_PERCENT = 0.8;

export const DEFAULT_SEED_PASSWORD = "mudar123";
