import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canManageTid, canViewTid, isMonthLocked } from "@/lib/permissions";
import { computeItemFields, tidTypeSchema } from "@/lib/tid-schemas";
import { parseYearMonth } from "@/lib/month";
import { writeAuditLog } from "@/lib/audit";
import { tidDetailInclude } from "@/lib/tid-queries";
import { TYPES_WITH_ITEM_LEVEL_MONTH } from "@/lib/constants";
import { z } from "zod";

async function loadTid(id: string) {
  const tid = await prisma.tid.findUnique({
    where: { id },
    include: tidDetailInclude,
  });
  if (!tid || tid.isDeleted) throw new ApiError(404, "TID não encontrada");
  return tid;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const tid = await loadTid(id);
    if (!canViewTid(user, tid, tid.originUnit, tid.destUnit)) {
      throw new ApiError(403, "Você não tem acesso a esta TID");
    }
    return NextResponse.json({ tid });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateTidSchema = z.object({
  type: tidTypeSchema,
  referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const existing = await loadTid(id);

    if (!canManageTid(user, existing, existing.originUnit, existing.destUnit)) {
      throw new ApiError(403, "Você não pode editar esta TID");
    }
    if (isMonthLocked(user, existing.referenceMonth)) {
      throw new ApiError(423, "TID travada: mês de referência já encerrado");
    }

    const body = updateTidSchema.parse(await req.json());
    if (body.type !== existing.type) {
      throw new ApiError(400, "Não é possível alterar o tipo de uma TID existente");
    }

    const computedItems = body.items.map((raw) => computeItemFields(body.type, raw));

    let referenceMonthStr: string;
    if (TYPES_WITH_ITEM_LEVEL_MONTH.includes(body.type)) {
      const months = new Set(
        body.items.map((raw) => (raw as { mesReferencia: string }).mesReferencia)
      );
      if (months.size !== 1) {
        throw new ApiError(400, "Todos os itens desta TID devem ter o mesmo Mês Referência");
      }
      referenceMonthStr = [...months][0];
    } else {
      if (!body.referenceMonth) throw new ApiError(400, "Mês de referência é obrigatório");
      referenceMonthStr = body.referenceMonth;
    }
    const referenceMonth = parseYearMonth(referenceMonthStr);

    if (isMonthLocked(user, referenceMonth)) {
      throw new ApiError(423, "Não é possível mover a TID para um mês já encerrado");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.tidItem.deleteMany({ where: { tidId: id } });
      const result = await tx.tid.update({
        where: { id },
        data: {
          referenceMonth,
          items: {
            create: computedItems.map((item) => ({
              ...item,
              mesReferencia:
                "mesReferencia" in item && typeof item.mesReferencia === "string"
                  ? parseYearMonth(item.mesReferencia)
                  : undefined,
            })),
          },
        },
        include: tidDetailInclude,
      });

      await writeAuditLog(tx, {
        entity: "Tid",
        entityId: id,
        action: "UPDATE",
        actorId: user.id,
        before: existing,
        after: result,
      });

      return result;
    });

    return NextResponse.json({ tid: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const existing = await loadTid(id);

    if (!canManageTid(user, existing, existing.originUnit, existing.destUnit)) {
      throw new ApiError(403, "Você não pode excluir esta TID");
    }
    if (isMonthLocked(user, existing.referenceMonth)) {
      throw new ApiError(423, "TID travada: mês de referência já encerrado");
    }

    await prisma.$transaction(async (tx) => {
      await tx.tid.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await writeAuditLog(tx, {
        entity: "Tid",
        entityId: id,
        action: "DELETE",
        actorId: user.id,
        before: existing,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
