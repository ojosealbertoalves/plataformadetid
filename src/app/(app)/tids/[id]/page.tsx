import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tidDetailInclude } from "@/lib/tid-queries";
import { canDecideTid, canManageTid, canViewTid, isMonthLocked } from "@/lib/permissions";
import { formatBRL } from "@/lib/money";
import { formatYearMonth, formatYearMonthLabel } from "@/lib/month";
import { TID_STATUS_LABELS, TID_TYPE_LABELS, type TidStatus, type TidType } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ItemsTable } from "@/components/tid-detail/items-table";
import { TidActions } from "@/components/tid-detail/tid-actions";
import { CommentBox } from "@/components/tid-detail/comment-box";
import { AttachmentsPanel } from "@/components/tid-detail/attachments-panel";
import { Lock } from "lucide-react";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "APROVADA") return "default";
  if (status === "RECUSADA") return "destructive";
  return "secondary";
}

export default async function TidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const tid = await prisma.tid.findUnique({
    where: { id },
    include: tidDetailInclude,
  });

  if (!tid || tid.isDeleted) notFound();
  if (!canViewTid(user, tid, tid.originUnit, tid.destUnit)) notFound();

  const total = tid.items.reduce((acc, i) => acc + i.valorTidCents, 0);
  const locked = isMonthLocked(user, tid.referenceMonth);
  const canDecide = canDecideTid(user, tid, tid.destUnit) && tid.status === "PENDENTE";
  const canManage = canManageTid(user, tid, tid.originUnit, tid.destUnit) && !locked;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            TID {tid.number} — {tid.originUnit.code} → {tid.destUnit.code}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tid.label} · {TID_TYPE_LABELS[tid.type as TidType]}
          </p>
        </div>
        <Badge variant={statusVariant(tid.status)} className="text-sm">
          {TID_STATUS_LABELS[tid.status as TidStatus]}
        </Badge>
      </div>

      {locked && (
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>TID travada</AlertTitle>
          <AlertDescription>
            O mês de referência desta TID já foi encerrado. Apenas o administrador pode editá-la.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">Origem</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {tid.originUnit.code} — {tid.originUnit.name}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">Destino</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {tid.destUnit.code} — {tid.destUnit.name}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Mês de Referência
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {formatYearMonthLabel(tid.referenceMonth)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold tabular-nums">{formatBRL(total)}</CardContent>
        </Card>
      </div>

      <TidActions tidId={tid.id} canDecide={canDecide} canManage={canManage} locked={locked} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Itens</h2>
        <ItemsTable type={tid.type as TidType} items={tid.items} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Anexos (Nota Fiscal)</h2>
        <AttachmentsPanel tidId={tid.id} attachments={tid.attachments} canUpload={canManage} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Comentários</h2>
        <div className="space-y-3">
          {tid.comments.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum comentário ainda.</p>
          )}
          {tid.comments.map((c) => (
            <div key={c.id} className="rounded-md border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{c.author.name}</span>
                <span className="text-muted-foreground text-xs">
                  {c.createdAt.toLocaleString("pt-BR")}
                </span>
              </div>
              <p>{c.text}</p>
            </div>
          ))}
          <CommentBox tidId={tid.id} />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Criada por {tid.createdBy.name} em {tid.createdAt.toLocaleString("pt-BR")}
        {tid.approvedAt && ` · Aprovada em ${tid.approvedAt.toLocaleString("pt-BR")}`}
        {" · "}Referência: {formatYearMonth(tid.referenceMonth)}
      </p>
    </div>
  );
}
