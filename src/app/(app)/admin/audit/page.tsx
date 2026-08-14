import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS, TID_TYPE_LABELS, type TidType } from "@/lib/constants";
import { formatBRL } from "@/lib/money";
import { HistoryTable, type HistoryRowData } from "@/components/admin/history-table";

const ACTION_LABELS: Record<(typeof AUDIT_ACTIONS)[number], string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  APPROVE: "Aprovação",
  REJECT: "Recusa",
};

interface TidSnapshot {
  type?: string;
  status?: string;
  comment?: string;
  items?: { valorTidCents: number }[];
}

function parseSnapshot(raw: string | null): TidSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TidSnapshot;
  } catch {
    return null;
  }
}

function sumItems(items: { valorTidCents: number }[] | undefined): number | null {
  if (!items) return null;
  return items.reduce((acc, i) => acc + (i.valorTidCents ?? 0), 0);
}

function describeLog(
  action: string,
  before: TidSnapshot | null,
  after: TidSnapshot | null
): string {
  switch (action) {
    case "CREATE": {
      const type = after?.type as TidType | undefined;
      const typeLabel = type ? TID_TYPE_LABELS[type] : null;
      const total = sumItems(after?.items);
      const parts = ["TID criada"];
      if (typeLabel) parts.push(typeLabel);
      if (total !== null) parts.push(formatBRL(total));
      return parts.join(" — ");
    }
    case "APPROVE":
      return "Aprovada";
    case "REJECT":
      return after?.comment ? `Recusada — motivo: ${after.comment}` : "Recusada";
    case "UPDATE":
      return "Editada";
    case "DELETE":
      return "Excluída (soft-delete)";
    default:
      return "—";
  }
}

export default async function AdminAuditPage() {
  await requireRole(["ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, login: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tidIds = [...new Set(logs.filter((l) => l.entity === "Tid").map((l) => l.entityId))];
  const tids = tidIds.length
    ? await prisma.tid.findMany({
        where: { id: { in: tidIds } },
        select: { id: true, label: true },
      })
    : [];
  const tidLabelById = new Map(tids.map((t) => [t.id, t.label]));

  const rows: HistoryRowData[] = logs.map((log) => {
    const before = parseSnapshot(log.before);
    const after = parseSnapshot(log.after);
    const tidLabel = log.entity === "Tid" ? (tidLabelById.get(log.entityId) ?? null) : null;

    return {
      id: log.id,
      when: log.createdAt.toLocaleString("pt-BR"),
      action: log.action,
      actionLabel: ACTION_LABELS[log.action as (typeof AUDIT_ACTIONS)[number]] ?? log.action,
      entityLabel: tidLabel ? `TID ${tidLabel}` : log.entity,
      actorName: log.actor.name,
      detail: describeLog(log.action, before, after),
      href: tidLabel ? `/tids/${log.entityId}` : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          Histórico completo de criações, edições, aprovações, recusas e exclusões. Nada é
          apagado de verdade — exclusões são lógicas (soft-delete). Clique em um registro para
          abrir a TID completa.
        </p>
      </div>

      <HistoryTable rows={rows} />
    </div>
  );
}
