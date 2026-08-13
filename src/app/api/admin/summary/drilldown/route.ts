import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { computeDrilldown } from "@/lib/summary";
import { tidTypeSchema } from "@/lib/tid-schemas";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (user.role !== "ADMIN") throw new ApiError(403, "Apenas o admin acessa o resumo");

    const sp = req.nextUrl.searchParams;
    const unitId = sp.get("unitId");
    const typeRaw = sp.get("type");
    const month = sp.get("month") ?? undefined;
    if (!unitId || !typeRaw) throw new ApiError(400, "unitId e type são obrigatórios");
    const type = tidTypeSchema.parse(typeRaw);

    const entries = await computeDrilldown(unitId, type, month);
    return NextResponse.json({ entries });
  } catch (err) {
    return handleApiError(err);
  }
}
