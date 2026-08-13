import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canDecideTid, isMonthLocked } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { tidDetailInclude } from "@/lib/tid-queries";

const rejectSchema = z.object({
  comment: z.string().trim().min(1, "É obrigatório informar o motivo da recusa"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { comment } = rejectSchema.parse(await req.json());

    const existing = await prisma.tid.findUnique({
      where: { id },
      include: tidDetailInclude,
    });
    if (!existing || existing.isDeleted) throw new ApiError(404, "TID não encontrada");

    if (!canDecideTid(user, existing, existing.destUnit)) {
      throw new ApiError(403, "Você não pode recusar esta TID");
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
        data: { status: "RECUSADA" },
        include: tidDetailInclude,
      });
      await tx.tidComment.create({
        data: { tidId: id, authorId: user.id, text: comment },
      });
      await writeAuditLog(tx, {
        entity: "Tid",
        entityId: id,
        action: "REJECT",
        actorId: user.id,
        before: { status: existing.status },
        after: { status: result.status, comment },
      });
      return result;
    });

    return NextResponse.json({ tid: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
