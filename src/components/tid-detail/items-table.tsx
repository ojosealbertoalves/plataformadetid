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
import type { TidType } from "@/lib/constants";

interface ItemLike {
  id: string;
  observacao: string | null;
  funcionario: string | null;
  mesReferencia: Date | null;
  funcao: string | null;
  centroCusto: string | null;
  localOrigem: string | null;
  localTrabalho: string | null;
  qtdeDias: number | null;
  valorFolhaCents: number | null;
  encargos80Cents: number | null;
  totalGeralCents: number | null;
  item: string | null;
  localUtilizacao: string | null;
  obraUau: { code: string; name: string } | null;
  procUau: string | null;
  fornecedor: string | null;
  docFiscal: string | null;
  valorNfCents: number | null;
  quantidade: number | null;
  valorUnitOriginalCents: number | null;
  valorDepreciacaoCents: number | null;
  valorTidCents: number;
}

export function ItemsTable({ type, items }: { type: TidType; items: ItemLike[] }) {
  const money = (c: number | null) => (c !== null ? formatBRL(c) : "—");

  if (type === "A" || type === "B") {
    return (
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Mês Ref.</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>CC</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Local Trabalho</TableHead>
              <TableHead className="text-right">Qtde Dias</TableHead>
              <TableHead className="text-right">Valor Folha</TableHead>
              <TableHead className="text-right">Valor TID</TableHead>
              <TableHead className="text-right">Encargos 80%</TableHead>
              <TableHead className="text-right">Total Geral</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.funcionario}</TableCell>
                <TableCell>{it.mesReferencia ? formatYearMonth(it.mesReferencia) : "—"}</TableCell>
                <TableCell>{it.funcao ?? "—"}</TableCell>
                <TableCell>{it.centroCusto ?? "—"}</TableCell>
                <TableCell>{it.localOrigem ?? "—"}</TableCell>
                <TableCell>{it.localTrabalho ?? "—"}</TableCell>
                <TableCell className="text-right">{it.qtdeDias ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{money(it.valorFolhaCents)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(it.valorTidCents)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(it.encargos80Cents)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(it.totalGeralCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (type === "C" || type === "D") {
    return (
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>CC</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Obra UAU</TableHead>
              <TableHead>Proc UAU</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Doc Fiscal</TableHead>
              <TableHead className="text-right">Valor NF</TableHead>
              <TableHead className="text-right">Valor TID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.item ?? "—"}</TableCell>
                <TableCell>{it.centroCusto ?? "—"}</TableCell>
                <TableCell>{it.localOrigem ?? "—"}</TableCell>
                <TableCell>{it.localUtilizacao ?? "—"}</TableCell>
                <TableCell>{it.obraUau ? `${it.obraUau.code}` : "—"}</TableCell>
                <TableCell>{it.procUau ?? "—"}</TableCell>
                <TableCell>{it.fornecedor ?? "—"}</TableCell>
                <TableCell>{it.docFiscal ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{money(it.valorNfCents)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(it.valorTidCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // E, F
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>CC</TableHead>
            <TableHead>Obra UAU</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Doc Fiscal</TableHead>
            <TableHead className="text-right">Qtde</TableHead>
            <TableHead className="text-right">Valor Unit. Original</TableHead>
            <TableHead className="text-right">Depreciação</TableHead>
            <TableHead className="text-right">Valor TID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>{it.item ?? "—"}</TableCell>
              <TableCell>{it.centroCusto ?? "—"}</TableCell>
              <TableCell>{it.obraUau ? `${it.obraUau.code}` : "—"}</TableCell>
              <TableCell>{it.fornecedor ?? "—"}</TableCell>
              <TableCell>{it.docFiscal ?? "—"}</TableCell>
              <TableCell className="text-right">{it.quantidade ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{money(it.valorUnitOriginalCents)}</TableCell>
              <TableCell className="text-right tabular-nums">{money(it.valorDepreciacaoCents)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{money(it.valorTidCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
