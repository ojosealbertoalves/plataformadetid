"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LinkRow } from "@/components/link-row";

export interface HistoryRowData {
  id: string;
  when: string;
  action: string;
  actionLabel: string;
  entityLabel: string;
  actorName: string;
  detail: string;
  href: string | null;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "CREATE") return "default";
  if (action === "DELETE" || action === "REJECT") return "destructive";
  if (action === "APPROVE") return "default";
  return "secondary";
}

function RowCells({ row }: { row: HistoryRowData }) {
  return (
    <>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{row.when}</TableCell>
      <TableCell>
        <Badge variant={actionVariant(row.action)}>{row.actionLabel}</Badge>
      </TableCell>
      <TableCell className="text-sm font-medium">{row.entityLabel}</TableCell>
      <TableCell className="text-sm">{row.actorName}</TableCell>
      <TableCell className="max-w-md text-xs text-muted-foreground">{row.detail}</TableCell>
    </>
  );
}

export function HistoryTable({ rows }: { rows: HistoryRowData[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                Nenhum registro encontrado.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) =>
            row.href ? (
              <LinkRow key={row.id} href={row.href}>
                <RowCells row={row} />
              </LinkRow>
            ) : (
              <TableRow key={row.id}>
                <RowCells row={row} />
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}
