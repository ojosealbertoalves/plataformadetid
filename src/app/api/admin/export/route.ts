import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import {
  buildExportRows,
  rowsToCsv,
  rowsToTxt,
  rowsToXlsxBuffer,
} from "@/lib/export";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (user.role !== "ADMIN") throw new ApiError(403, "Apenas o admin pode exportar dados");

    const sp = req.nextUrl.searchParams;
    const format = sp.get("format") ?? "xlsx";
    const status = sp.get("status") ?? undefined;
    const type = sp.get("type") ?? undefined;
    const month = sp.get("month") ?? undefined;
    const unitId = sp.get("unitId") ?? undefined;

    const rows = await buildExportRows({ status, type, month, unitId });
    const filename = `tids-export-${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv") {
      return new NextResponse(rowsToCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === "txt") {
      return new NextResponse(rowsToTxt(rows), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.txt"`,
        },
      });
    }

    const buffer = rowsToXlsxBuffer(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
