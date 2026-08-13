import Link from "next/link";
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
import { InboxRowActions } from "@/components/inbox-row-actions";
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
          TIDs pendentes aguardando sua aprovação ou recusa.
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tids.map((tid) => {
                const total = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
                return (
                  <TableRow key={tid.id}>
                    <TableCell className="font-medium">
                      <Link href={`/tids/${tid.id}`} className="hover:underline">
                        {tid.label}
                      </Link>
                    </TableCell>
                    <TableCell>{TID_TYPE_LABELS[tid.type as TidType] ?? tid.type}</TableCell>
                    <TableCell>{tid.originUnit.code}</TableCell>
                    <TableCell>{formatYearMonth(tid.referenceMonth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(total)}</TableCell>
                    <TableCell>
                      <InboxRowActions tidId={tid.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
