interface TidDisplayLike {
  number: number;
  label: string;
  originUnit: { code: string };
  destUnit: { code: string };
}

/** Ex.: "MKT-01 → COM" */
export function tidShortDisplay(tid: TidDisplayLike): string {
  return `${tid.label} → ${tid.destUnit.code}`;
}

/** Ex.: "TID 1 — MKT → COM" (rótulo tipo documento, seção 6 do spec). */
export function tidDocumentLabel(tid: TidDisplayLike): string {
  return `TID ${tid.number} — ${tid.originUnit.code} → ${tid.destUnit.code}`;
}
