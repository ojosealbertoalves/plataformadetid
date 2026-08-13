import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

type SessionUser = Session["user"];

/** Restringe a visão de TIDs ao escopo permitido para o usuário logado. */
export function scopeWhereForUser(user: SessionUser): Prisma.TidWhereInput {
  if (user.role === "ADMIN") {
    return {};
  }
  if (user.role === "GERENTE_OBRA") {
    return {
      OR: [{ originUnit: { kind: "WORK" } }, { destUnit: { kind: "WORK" } }],
    };
  }
  // UNIDADE
  return {
    OR: [{ originUnitId: user.unitId ?? "__none__" }, { destUnitId: user.unitId ?? "__none__" }],
  };
}

export const tidListInclude = {
  originUnit: { select: { id: true, code: true, name: true, kind: true } },
  destUnit: { select: { id: true, code: true, name: true, kind: true } },
  createdBy: { select: { id: true, name: true, login: true } },
  items: { include: { obraUau: { select: { code: true, name: true } } } },
} satisfies Prisma.TidInclude;

export const tidDetailInclude = {
  ...tidListInclude,
  comments: {
    include: { author: { select: { id: true, name: true, login: true } } },
    orderBy: { createdAt: "asc" },
  },
  attachments: true,
} satisfies Prisma.TidInclude;
