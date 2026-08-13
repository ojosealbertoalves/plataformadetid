import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatYearMonth } from "@/lib/month";
import { TID_STATUS_LABELS, TID_TYPE_LABELS, type TidStatus, type TidType } from "@/lib/constants";

export interface TidRowData {
  id: string;
  label: string;
  number: number;
  type: string;
  status: string;
  referenceMonth: Date;
  createdAt: Date;
  originUnit: { code: string; name: string };
  destUnit: { code: string; name: string };
  items: { valorTidCents: number }[];
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "APROVADA") return "default";
  if (status === "RECUSADA") return "destructive";
  return "secondary";
}

export function TidTable({ tids, emptyMessage }: { tids: TidRowData[]; emptyMessage?: string }) {
  if (tids.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
        {emptyMessage ?? "Nenhuma TID encontrada."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TID</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Mês Ref.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Criada em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tids.map((tid) => {
            const total = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
            return (
              <TableRow key={tid.id} className="hover:bg-accent/50">
                <TableCell className="font-medium">
                  <Link href={`/tids/${tid.id}`} className="hover:underline">
                    {tid.label}
                  </Link>
                </TableCell>
                <TableCell>{TID_TYPE_LABELS[tid.type as TidType] ?? tid.type}</TableCell>
                <TableCell>{tid.originUnit.code}</TableCell>
                <TableCell>{tid.destUnit.code}</TableCell>
                <TableCell>{formatYearMonth(tid.referenceMonth)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(tid.status)}>
                    {TID_STATUS_LABELS[tid.status as TidStatus] ?? tid.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatBRL(total)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {tid.createdAt.toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
