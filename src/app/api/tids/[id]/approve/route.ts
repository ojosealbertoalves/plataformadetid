import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canDecideTid, isMonthLocked } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { tidDetailInclude } from "@/lib/tid-queries";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const existing = await prisma.tid.findUnique({
      where: { id },
      include: tidDetailInclude,
    });
    if (!existing || existing.isDeleted) throw new ApiError(404, "TID não encontrada");

    if (!canDecideTid(user, existing, existing.destUnit)) {
      throw new ApiError(403, "Você não pode aprovar esta TID");
    }
    if (existing.status !== "PENDENTE") {
      throw new ApiError(400, "Esta TID já foi decidida");
    }
    if (isMonthLocked(user, existing.referenceMonth)) {
      throw new ApiError(423, "TID travada: mês de referência já encerrado");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tid.update({
        where: { id },
        data: { status: "APROVADA", approvedAt: new Date() },
        include: tidDetailInclude,
      });
      await writeAuditLog(tx, {
        entity: "Tid",
        entityId: id,
        action: "APPROVE",
        actorId: user.id,
        before: { status: existing.status },
        after: { status: result.status },
      });
      return result;
    });

    return NextResponse.json({ tid: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
