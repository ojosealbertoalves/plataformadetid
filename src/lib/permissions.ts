import type { Session } from "next-auth";
import { isSameYearMonth } from "./month";

type SessionUser = Session["user"];

interface TidLike {
  originUnitId: string;
  destUnitId: string;
  referenceMonth: Date;
  status: string;
}

interface UnitLike {
  id: string;
  /** Vem do Prisma como `string` (ver nota de portabilidade no schema); os
   * únicos valores válidos em runtime são os de UnitKindLike. */
  kind: string;
}

/** ADMIN não cria/envia/recebe/aprova TID — apenas gerencia. */
export function canCreateTid(user: SessionUser): boolean {
  return user.role === "GERENTE_OBRA" || user.role === "UNIDADE";
}

/**
 * Retorna se o usuário pode criar uma TID com a origem/destino informados.
 * - UNIDADE só pode usar a própria unidade como origem.
 * - GERENTE_OBRA só pode lançar entre obras (origem e destino kind=WORK).
 */
export function canCreateTidFor(
  user: SessionUser,
  originUnit: UnitLike,
  destUnit: UnitLike
): boolean {
  if (originUnit.id === destUnit.id) return false;
  if (user.role === "UNIDADE") {
    return user.unitId === originUnit.id;
  }
  if (user.role === "GERENTE_OBRA") {
    return originUnit.kind === "WORK" && destUnit.kind === "WORK";
  }
  return false;
}

/** Se true, a TID entra direto como APROVADA (sem passar por PENDENTE). */
export function isAutoApproved(user: SessionUser): boolean {
  return user.role === "GERENTE_OBRA";
}

function unitInvolvesGerenteScope(unit: UnitLike | null | undefined): boolean {
  return !!unit && unit.kind === "WORK";
}

/** Pode editar/excluir o conteúdo da TID (sujeito à trava de mês, checada à parte). */
export function canManageTid(
  user: SessionUser,
  tid: TidLike,
  originUnit: UnitLike,
  destUnit: UnitLike
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "GERENTE_OBRA") {
    return unitInvolvesGerenteScope(originUnit) || unitInvolvesGerenteScope(destUnit);
  }
  if (user.role === "UNIDADE") {
    return user.unitId === tid.originUnitId;
  }
  return false;
}

/** Pode aprovar/recusar (é o destinatário da TID). */
export function canDecideTid(
  user: SessionUser,
  tid: TidLike,
  destUnit: UnitLike
): boolean {
  if (user.role === "GERENTE_OBRA") {
    return destUnit.kind === "WORK";
  }
  if (user.role === "UNIDADE") {
    return user.unitId === tid.destUnitId;
  }
  return false;
}

/** Pode ver a TID (para listagens/detalhe). */
export function canViewTid(
  user: SessionUser,
  tid: TidLike,
  originUnit: UnitLike,
  destUnit: UnitLike
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "GERENTE_OBRA") {
    return unitInvolvesGerenteScope(originUnit) || unitInvolvesGerenteScope(destUnit);
  }
  if (user.role === "UNIDADE") {
    return user.unitId === tid.originUnitId || user.unitId === tid.destUnitId;
  }
  return false;
}

/**
 * Trava de mês: apenas ADMIN pode alterar TIDs de meses de referência
 * anteriores ao mês corrente. Aplica-se a edição, exclusão, aprovação,
 * recusa e comentários de recusa.
 */
export function isMonthLocked(user: SessionUser, referenceMonth: Date): boolean {
  if (user.role === "ADMIN") return false;
  return !isSameYearMonth(referenceMonth, new Date());
}
