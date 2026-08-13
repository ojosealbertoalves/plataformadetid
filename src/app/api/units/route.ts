import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, handleApiError } from "@/lib/api-helpers";

/** Lista unidades (departamentos e/ou obras) para uso em dropdowns. */
export async function GET(req: NextRequest) {
  try {
    await requireApiUser();
    const kind = req.nextUrl.searchParams.get("kind");

    const units = await prisma.unit.findMany({
      where: {
        ativo: true,
        ...(kind ? { kind } : {}),
      },
      select: { id: true, code: true, name: true, kind: true },
      orderBy: [{ kind: "asc" }, { code: "asc" }],
    });

    return NextResponse.json({ units });
  } catch (err) {
    return handleApiError(err);
  }
}
