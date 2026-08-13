/**
 * Todo valor monetário é armazenado no banco como Int (centavos) para evitar
 * problemas de precisão de ponto flutuante e para funcionar de forma idêntica
 * em SQLite e PostgreSQL (o tipo Decimal do Prisma não é suportado por sqlite).
 */

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  return fromCents(cents).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatBRLFromValue(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function sumCents(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}
