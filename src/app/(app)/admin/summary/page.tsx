import { requireRole } from "@/lib/session";
import { AdminSummaryClient } from "@/components/admin/summary-client";

export default async function AdminSummaryPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resumo — Saldo Líquido por Unidade</h1>
        <p className="text-muted-foreground text-sm">
          Saldo = valor creditado (unidade como origem) − valor debitado (unidade como destino).
          Considera apenas TIDs aprovadas. Clique em uma célula para ver a composição.
        </p>
      </div>
      <AdminSummaryClient />
    </div>
  );
}
