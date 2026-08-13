/**
 * Meses são sempre representados/persistidos como o primeiro dia do mês em UTC
 * (ex.: "2026-08" -> 2026-08-01T00:00:00.000Z), para evitar problemas de fuso
 * horário ao comparar/filtrar por mês de referência.
 */

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseYearMonth(ym: string): Date {
  if (!YEAR_MONTH_RE.test(ym)) {
    throw new Error(`Formato de mês inválido: "${ym}" (esperado AAAA-MM)`);
  }
  return new Date(`${ym}-01T00:00:00.000Z`);
}

export function formatYearMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function currentYearMonth(): string {
  return formatYearMonth(new Date());
}

export function isSameYearMonth(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

export function formatYearMonthLabel(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
