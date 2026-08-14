import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tidListInclude } from "@/lib/tid-queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/money";
import { formatYearMonth } from "@/lib/month";
import { TID_TYPE_LABELS, type TidType } from "@/lib/constants";
import { LinkRow } from "@/components/link-row";
import { ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";

export default async function InboxPage() {
  const user = await requireUser();

  const where: Prisma.TidWhereInput = {
    isDeleted: false,
    status: "PENDENTE",
    ...(user.role === "GERENTE_OBRA"
      ? { destUnit: { kind: "WORK" } }
      : { destUnitId: user.unitId ?? "__none__" }),
  };

  const tids = await prisma.tid.findMany({
    where,
    include: tidListInclude,
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Caixa de Entrada</h1>
        <p className="text-muted-foreground text-sm">
          TIDs pendentes aguardando sua aprovação ou recusa. Clique em uma TID para ver todos os
          detalhes antes de decidir.
        </p>
      </div>

      {tids.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
          Nenhuma TID pendente no momento.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Mês Ref.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tids.map((tid) => {
                const total = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
                return (
                  <LinkRow key={tid.id} href={`/tids/${tid.id}`}>
                    <TableCell className="font-medium">{tid.label}</TableCell>
                    <TableCell>{TID_TYPE_LABELS[tid.type as TidType] ?? tid.type}</TableCell>
                    <TableCell>{tid.originUnit.code}</TableCell>
                    <TableCell>{formatYearMonth(tid.referenceMonth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(total)}</TableCell>
                    <TableCell>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </TableCell>
                  </LinkRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
