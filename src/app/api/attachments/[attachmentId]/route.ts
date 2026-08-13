import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canViewTid } from "@/lib/permissions";
import { storageProvider } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const user = await requireApiUser();
    const { attachmentId } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        tid: { include: { originUnit: true, destUnit: true } },
        tidItem: { include: { tid: { include: { originUnit: true, destUnit: true } } } },
      },
    });
    if (!attachment) throw new ApiError(404, "Anexo não encontrado");

    const tid = attachment.tid ?? attachment.tidItem?.tid;
    if (!tid) throw new ApiError(404, "Anexo não encontrado");
    if (!canViewTid(user, tid, tid.originUnit, tid.destUnit)) {
      throw new ApiError(403, "Você não tem acesso a este anexo");
    }

    const buffer = await storageProvider.read(attachment.path);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mime,
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
