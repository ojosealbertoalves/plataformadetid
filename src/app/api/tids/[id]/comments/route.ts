import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canViewTid } from "@/lib/permissions";
import { tidDetailInclude } from "@/lib/tid-queries";

const commentSchema = z.object({
  text: z.string().trim().min(1, "Comentário não pode ser vazio"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { text } = commentSchema.parse(await req.json());

    const existing = await prisma.tid.findUnique({
      where: { id },
      include: tidDetailInclude,
    });
    if (!existing || existing.isDeleted) throw new ApiError(404, "TID não encontrada");
    if (!canViewTid(user, existing, existing.originUnit, existing.destUnit)) {
      throw new ApiError(403, "Você não tem acesso a esta TID");
    }

    const comment = await prisma.tidComment.create({
      data: { tidId: id, authorId: user.id, text },
      include: { author: { select: { id: true, name: true, login: true } } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
