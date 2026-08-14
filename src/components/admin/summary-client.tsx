"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TID_TYPES, TID_TYPE_SHORT_LABELS, type TidType } from "@/lib/constants";
import { Download } from "lucide-react";
import Link from "next/link";

interface SummaryRow {
  unitId: string;
  unitCode: string;
  unitName: string;
  unitKind: string;
  byType: Record<TidType, number>;
  total: number;
}

interface DrilldownEntry {
  tidId: string;
  documentLabel: string;
  originCode: string;
  destCode: string;
  referenceMonth: string;
  valueCents: number;
  role: "credito" | "debito";
}

function money(cents: number) {
  const formatted = formatBRL(Math.abs(cents));
  if (cents < 0) return `(${formatted})`;
  return formatted;
}

export function AdminSummaryClient() {
  const [month, setMonth] = useState("");
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<{ unitId: string; unitCode: string; type: TidType } | null>(
    null
  );
  const [drillEntries, setDrillEntries] = useState<DrilldownEntry[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = month ? `?month=${month}` : "";
    const res = await fetch(`/api/admin/summary${qs}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDrilldown(unitId: string, unitCode: string, type: TidType) {
    setDrill({ unitId, unitCode, type });
    setDrillLoading(true);
    const qs = new URLSearchParams({ unitId, type, ...(month ? { month } : {}) });
    const res = await fetch(`/api/admin/summary/drilldown?${qs.toString()}`);
    const data = await res.json();
    setDrillEntries(data.entries ?? []);
    setDrillLoading(false);
  }

  const exportQs = month ? `&month=${month}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
          />
          {month && (
            <Button variant="ghost" size="sm" onClick={() => setMonth("")}>
              Todos os períodos
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/api/admin/export?format=xlsx${exportQs}`}>
                <Download className="mr-1 size-4" />
                Excel
              </Link>
            }
          />
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/api/admin/export?format=csv${exportQs}`}>
                <Download className="mr-1 size-4" />
                CSV
              </Link>
            }
          />
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/api/admin/export?format=txt${exportQs}`}>
                <Download className="mr-1 size-4" />
                TXT
              </Link>
            }
          />
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-card sticky left-0 z-20">Unidade</TableHead>
              {TID_TYPES.map((t) => (
                <TableHead key={t} className="text-right whitespace-nowrap">
                  {t} — {TID_TYPE_SHORT_LABELS[t]}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={row.unitId} className={cn(i % 2 === 1 && "bg-muted/20")}>
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 font-medium whitespace-nowrap",
                      i % 2 === 1 ? "bg-[#1c2530]" : "bg-card"
                    )}
                  >
                    {row.unitCode} — {row.unitName}
                  </TableCell>
                  {TID_TYPES.map((t) => {
                    const value = row.byType[t];
                    return (
                      <TableCell
                        key={t}
                        className={cn(
                          "text-right tabular-nums",
                          value !== 0 &&
                            "hover:bg-brand/15 cursor-pointer rounded-sm underline decoration-dotted underline-offset-4 transition-colors",
                          value < 0 && "text-red-400",
                          value === 0 && "text-muted-foreground"
                        )}
                        onClick={() => value !== 0 && openDrilldown(row.unitId, row.unitCode, t)}
                      >
                        {value === 0 ? "—" : money(value)}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      row.total < 0 && "text-red-400"
                    )}
                  >
                    {money(row.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!drill} onOpenChange={(open) => !open && setDrill(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Composição — {drill?.unitCode} · {drill && TID_TYPE_SHORT_LABELS[drill.type]}
            </DialogTitle>
          </DialogHeader>
          {drillLoading ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Carregando...</p>
          ) : drillEntries.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Nenhuma TID encontrada.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TID</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillEntries.map((entry) => (
                    <TableRow
                      key={entry.tidId}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => window.open(`/tids/${entry.tidId}`, "_blank")}
                    >
                      <TableCell>
                        <Link
                          href={`/tids/${entry.tidId}`}
                          className="hover:underline"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.documentLabel}
                        </Link>
                      </TableCell>
                      <TableCell>{entry.referenceMonth}</TableCell>
                      <TableCell>{entry.role === "credito" ? "Crédito (enviou)" : "Débito (recebeu)"}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          entry.valueCents < 0 && "text-red-600 dark:text-red-400"
                        )}
                      >
                        {money(entry.valueCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
