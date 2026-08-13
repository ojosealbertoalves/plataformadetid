import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { computeSummaryMatrix } from "@/lib/summary";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (user.role !== "ADMIN") throw new ApiError(403, "Apenas o admin acessa o resumo");

    const month = req.nextUrl.searchParams.get("month") ?? undefined;
    const rows = await computeSummaryMatrix(month);

    return NextResponse.json({ rows });
  } catch (err) {
    return handleApiError(err);
  }
}
