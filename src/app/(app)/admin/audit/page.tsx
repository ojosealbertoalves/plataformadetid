import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AUDIT_ACTIONS } from "@/lib/constants";

const ACTION_LABELS: Record<(typeof AUDIT_ACTIONS)[number], string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  APPROVE: "Aprovação",
  REJECT: "Recusa",
};

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "CREATE") return "default";
  if (action === "DELETE" || action === "REJECT") return "destructive";
  if (action === "APPROVE") return "default";
  return "secondary";
}

export default async function AdminAuditPage() {
  await requireRole(["ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, login: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="text-muted-foreground text-sm">
          Histórico completo de criações, edições, aprovações, recusas e exclusões. Nada é
          apagado de verdade — exclusões são lógicas (soft-delete).
        </p>
      </div>

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
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {log.createdAt.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge variant={actionVariant(log.action)}>
                    {ACTION_LABELS[log.action as (typeof AUDIT_ACTIONS)[number]] ?? log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.entity} <span className="text-muted-foreground">#{log.entityId.slice(0, 8)}</span>
                </TableCell>
                <TableCell className="text-sm">{log.actor.name}</TableCell>
                <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                  {log.after ?? log.before ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
