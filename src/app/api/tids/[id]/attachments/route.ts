import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { canManageTid } from "@/lib/permissions";
import { storageProvider } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const tid = await prisma.tid.findUnique({
      where: { id },
      include: { originUnit: true, destUnit: true },
    });
    if (!tid || tid.isDeleted) throw new ApiError(404, "TID não encontrada");
    if (!canManageTid(user, tid, tid.originUnit, tid.destUnit)) {
      throw new ApiError(403, "Você não pode anexar arquivos a esta TID");
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Arquivo não enviado");
    if (file.size > MAX_SIZE) throw new ApiError(400, "Arquivo maior que 10MB");

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storageProvider.save(file.name, file.type || "application/octet-stream", buffer);

    const attachment = await prisma.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          tidId: id,
          fileName: stored.fileName,
          path: stored.path,
          mime: stored.mime,
          size: stored.size,
        },
      });
      await writeAuditLog(tx, {
        entity: "Attachment",
        entityId: created.id,
        action: "CREATE",
        actorId: user.id,
        after: { tidId: id, fileName: stored.fileName },
      });
      return created;
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
