import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scopeWhereForUser, tidListInclude } from "@/lib/tid-queries";
import { parseYearMonth } from "@/lib/month";
import { formatBRL } from "@/lib/money";
import { StatCard } from "@/components/stat-card";
import { TidTable } from "@/components/tid-table";
import { TidFilters } from "@/components/tid-filters";
import type { Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ month?: string; type?: string; status?: string }>;
}

type TidWithRelations = Prisma.TidGetPayload<{ include: typeof tidListInclude }>;

function statsFor(tids: TidWithRelations[], side: "origin" | "dest", unitIds: (string | null)[]) {
  const filtered = tids.filter((t) =>
    side === "origin" ? unitIds.includes(t.originUnitId) : unitIds.includes(t.destUnitId)
  );
  const total = filtered.reduce(
    (acc, t) => acc + t.items.reduce((a, i) => a + i.valorTidCents, 0),
    0
  );
  return {
    count: filtered.length,
    pendente: filtered.filter((t) => t.status === "PENDENTE").length,
    aprovada: filtered.filter((t) => t.status === "APROVADA").length,
    recusada: filtered.filter((t) => t.status === "RECUSADA").length,
    total,
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    redirect("/admin/summary");
  }

  const sp = await searchParams;

  const where: Prisma.TidWhereInput = {
    isDeleted: false,
    AND: [scopeWhereForUser(user)],
  };
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;
  if (sp.month) where.referenceMonth = parseYearMonth(sp.month);

  const tids = await prisma.tid.findMany({
    where,
    include: tidListInclude,
    orderBy: { createdAt: "desc" },
  });

  const relevantUnitIds =
    user.role === "GERENTE_OBRA"
      ? tids
          .flatMap((t) => [t.originUnit, t.destUnit])
          .filter((u) => u.kind === "WORK")
          .map((u) => u.id)
      : [user.unitId];

  const sent = statsFor(tids, "origin", relevantUnitIds);
  const received = statsFor(tids, "dest", relevantUnitIds);

  const title =
    user.role === "GERENTE_OBRA" ? "Dashboard — Todas as Obras" : `Dashboard — ${user.unitName}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe as TIDs enviadas e recebidas pela sua unidade.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Enviadas
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Enviadas" count={sent.count} valueLabel={formatBRL(sent.total)} />
          <StatCard label="Pendentes" count={sent.pendente} valueLabel="aguardando decisão" tone="warning" />
          <StatCard label="Aprovadas" count={sent.aprovada} valueLabel="confirmadas" tone="positive" />
          <StatCard label="Recusadas" count={sent.recusada} valueLabel="com motivo registrado" tone="negative" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Recebidas
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Recebidas" count={received.count} valueLabel={formatBRL(received.total)} />
          <StatCard label="Pendentes" count={received.pendente} valueLabel="aguardando sua decisão" tone="warning" />
          <StatCard label="Aprovadas" count={received.aprovada} valueLabel="confirmadas" tone="positive" />
          <StatCard label="Recusadas" count={received.recusada} valueLabel="recusadas por você" tone="negative" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Histórico
          </h2>
          <TidFilters />
        </div>
        <TidTable tids={tids} />
      </section>
    </div>
  );
}
