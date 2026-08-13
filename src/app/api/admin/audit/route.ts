import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (user.role !== "ADMIN") throw new ApiError(403, "Apenas o admin acessa a auditoria");

    const sp = req.nextUrl.searchParams;
    const entity = sp.get("entity") ?? undefined;
    const entityId = sp.get("entityId") ?? undefined;
    const take = Math.min(Number(sp.get("take") ?? 100), 500);

    const logs = await prisma.auditLog.findMany({
      where: { ...(entity ? { entity } : {}), ...(entityId ? { entityId } : {}) },
      include: { actor: { select: { id: true, name: true, login: true } } },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ logs });
  } catch (err) {
    return handleApiError(err);
  }
}
