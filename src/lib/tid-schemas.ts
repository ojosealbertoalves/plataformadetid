import { z } from "zod";
import { ENCARGOS_PERCENT, TID_TYPES } from "./constants";
import { toCents } from "./money";

export const tidTypeSchema = z.enum(TID_TYPES);

const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato de mês inválido (AAAA-MM)");

const moneyInput = z
  .number({ error: "Informe um valor numérico" })
  .finite()
  .min(0, "O valor não pode ser negativo");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const requiredText = z.string().trim().min(1, "Campo obrigatório");

/** Campos de entrada (valores em reais) por tipo de item de TID, vindos do formulário. */

export const itemABSchema = z.object({
  funcionario: requiredText,
  mesReferencia: yearMonthSchema,
  observacao: optionalText,
  funcao: optionalText,
  centroCusto: optionalText,
  localOrigem: optionalText,
  localTrabalho: optionalText,
  qtdeDias: z.number().int().min(0).optional(),
  valorFolha: moneyInput.optional(),
  valorTid: moneyInput,
});
export type ItemABInput = z.infer<typeof itemABSchema>;

export const itemCDSchema = z.object({
  item: optionalText,
  observacao: optionalText,
  centroCusto: optionalText,
  localOrigem: optionalText,
  localUtilizacao: optionalText,
  obraUauId: requiredText,
  procUau: optionalText,
  fornecedor: optionalText,
  docFiscal: optionalText,
  valorNf: moneyInput.optional(),
  valorTid: moneyInput,
});
export type ItemCDInput = z.infer<typeof itemCDSchema>;

export const itemEFSchema = z.object({
  item: optionalText,
  observacao: optionalText,
  centroCusto: optionalText,
  localOrigem: optionalText,
  localUtilizacao: optionalText,
  obraUauId: requiredText,
  procUau: optionalText,
  fornecedor: optionalText,
  docFiscal: optionalText,
  quantidade: z.number().finite().positive("Quantidade deve ser maior que zero"),
  valorUnitOriginal: moneyInput,
  valorDepreciacao: moneyInput,
});
export type ItemEFInput = z.infer<typeof itemEFSchema>;

export const createTidSchema = z.object({
  type: tidTypeSchema,
  originUnitId: requiredText,
  destUnitId: requiredText,
  /** Obrigatório apenas para C, D, E, F. Para A/B é derivado dos itens. */
  referenceMonth: yearMonthSchema.optional(),
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "Adicione ao menos um item"),
});
export type CreateTidInput = z.infer<typeof createTidSchema>;

export function itemSchemaForType(type: string) {
  if (type === "A" || type === "B") return itemABSchema;
  if (type === "C" || type === "D") return itemCDSchema;
  if (type === "E" || type === "F") return itemEFSchema;
  throw new Error(`Tipo de TID desconhecido: ${type}`);
}

/**
 * Calcula, no servidor, todos os campos derivados de um item e retorna o
 * objeto pronto para persistir (valores já em centavos). Nunca confia em
 * valores calculados vindos do cliente.
 */
export function computeItemFields(type: string, raw: unknown) {
  const schema = itemSchemaForType(type);
  const input = schema.parse(raw);

  if (type === "A" || type === "B") {
    const i = input as ItemABInput;
    const valorTidCents = toCents(i.valorTid);
    const encargos80Cents = Math.round(valorTidCents * ENCARGOS_PERCENT);
    const totalGeralCents = valorTidCents + encargos80Cents;
    return {
      funcionario: i.funcionario,
      mesReferencia: i.mesReferencia, // convertido para Date pelo chamador
      observacao: i.observacao ?? null,
      funcao: i.funcao ?? null,
      centroCusto: i.centroCusto ?? null,
      localOrigem: i.localOrigem ?? null,
      localTrabalho: i.localTrabalho ?? null,
      qtdeDias: i.qtdeDias ?? null,
      valorFolhaCents: i.valorFolha !== undefined ? toCents(i.valorFolha) : null,
      encargos80Cents,
      totalGeralCents,
      valorTidCents,
    };
  }

  if (type === "C" || type === "D") {
    const i = input as ItemCDInput;
    const valorTidCents = toCents(i.valorTid);
    return {
      item: i.item ?? null,
      observacao: i.observacao ?? null,
      centroCusto: i.centroCusto ?? null,
      localOrigem: i.localOrigem ?? null,
      localUtilizacao: i.localUtilizacao ?? null,
      obraUauId: i.obraUauId,
      procUau: i.procUau ?? null,
      fornecedor: i.fornecedor ?? null,
      docFiscal: i.docFiscal ?? null,
      valorNfCents: i.valorNf !== undefined ? toCents(i.valorNf) : null,
      valorTidCents,
    };
  }

  // E, F
  const i = input as ItemEFInput;
  const valorUnitOriginalCents = toCents(i.valorUnitOriginal);
  const valorDepreciacaoCents = toCents(i.valorDepreciacao);
  const valorTidCents = Math.round(
    i.quantidade * (valorUnitOriginalCents - valorDepreciacaoCents)
  );
  return {
    item: i.item ?? null,
    observacao: i.observacao ?? null,
    centroCusto: i.centroCusto ?? null,
    localOrigem: i.localOrigem ?? null,
    localUtilizacao: i.localUtilizacao ?? null,
    obraUauId: i.obraUauId,
    procUau: i.procUau ?? null,
    fornecedor: i.fornecedor ?? null,
    docFiscal: i.docFiscal ?? null,
    quantidade: i.quantidade,
    valorUnitOriginalCents,
    valorDepreciacaoCents,
    valorTidCents,
  };
}
