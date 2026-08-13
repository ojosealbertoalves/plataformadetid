import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canCreateTid, canCreateTidFor, isAutoApproved } from "@/lib/permissions";
import { createTidSchema, computeItemFields } from "@/lib/tid-schemas";
import { parseYearMonth } from "@/lib/month";
import { buildTidLabel } from "@/lib/tid-number";
import { writeAuditLog } from "@/lib/audit";
import { scopeWhereForUser, tidListInclude } from "@/lib/tid-queries";
import { TYPES_WITH_ITEM_LEVEL_MONTH } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const type = sp.get("type");
    const month = sp.get("month");
    const unitId = sp.get("unitId");

    const where: Prisma.TidWhereInput = {
      isDeleted: false,
      AND: [scopeWhereForUser(user)],
    };
    if (status) where.status = status;
    if (type) where.type = type;
    if (month) where.referenceMonth = parseYearMonth(month);
    if (unitId && user.role === "ADMIN") {
      where.AND = [
        ...(where.AND as Prisma.TidWhereInput[]),
        { OR: [{ originUnitId: unitId }, { destUnitId: unitId }] },
      ];
    }

    const tids = await prisma.tid.findMany({
      where,
      include: tidListInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tids });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (!canCreateTid(user)) {
      throw new ApiError(403, "Seu papel não pode criar TIDs");
    }

    const body = createTidSchema.parse(await req.json());

    const [originUnit, destUnit] = await Promise.all([
      prisma.unit.findUnique({ where: { id: body.originUnitId } }),
      prisma.unit.findUnique({ where: { id: body.destUnitId } }),
    ]);
    if (!originUnit || !originUnit.ativo) throw new ApiError(400, "Unidade de origem inválida");
    if (!destUnit || !destUnit.ativo) throw new ApiError(400, "Unidade de destino inválida");

    if (!canCreateTidFor(user, originUnit, destUnit)) {
      throw new ApiError(403, "Você não pode criar uma TID com essa origem/destino");
    }

    const computedItems = body.items.map((raw) => computeItemFields(body.type, raw));

    let referenceMonthStr: string;
    if (TYPES_WITH_ITEM_LEVEL_MONTH.includes(body.type)) {
      const months = new Set(
        body.items.map((raw) => (raw as { mesReferencia: string }).mesReferencia)
      );
      if (months.size !== 1) {
        throw new ApiError(
          400,
          "Todos os itens desta TID devem ter o mesmo Mês Referência"
        );
      }
      referenceMonthStr = [...months][0];
    } else {
      if (!body.referenceMonth) {
        throw new ApiError(400, "Mês de referência é obrigatório");
      }
      referenceMonthStr = body.referenceMonth;
    }
    const referenceMonth = parseYearMonth(referenceMonthStr);

    const autoApproved = isAutoApproved(user);
    const status = autoApproved ? "APROVADA" : "PENDENTE";

    const tid = await prisma.$transaction(async (tx) => {
      const updatedUnit = await tx.unit.update({
        where: { id: originUnit.id },
        data: { lastTidNumber: { increment: 1 } },
        select: { lastTidNumber: true },
      });
      const number = updatedUnit.lastTidNumber;
      const label = buildTidLabel(originUnit.code, number);

      const created = await tx.tid.create({
        data: {
          number,
          label,
          type: body.type,
          originUnitId: originUnit.id,
          destUnitId: destUnit.id,
          referenceMonth,
          status,
          createdById: user.id,
          approvedAt: autoApproved ? new Date() : null,
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
        include: tidListInclude,
      });

      await writeAuditLog(tx, {
        entity: "Tid",
        entityId: created.id,
        action: "CREATE",
        actorId: user.id,
        after: created,
      });

      return created;
    });

    return NextResponse.json({ tid }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
