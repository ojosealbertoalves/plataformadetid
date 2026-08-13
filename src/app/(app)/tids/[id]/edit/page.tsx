import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { tidDetailInclude } from "@/lib/tid-queries";
import { canManageTid, isMonthLocked } from "@/lib/permissions";
import { groupForType, itemToFormState } from "@/lib/tid-form-fields";
import { formatYearMonth } from "@/lib/month";
import { EditTidForm } from "@/components/tid-form/edit-tid-form";
import type { TidType } from "@/lib/constants";

export default async function EditTidPage({
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

  const locked = isMonthLocked(user, tid.referenceMonth);
  if (!canManageTid(user, tid, tid.originUnit, tid.destUnit) || locked) {
    redirect(`/tids/${id}`);
  }

  const works = await prisma.unit.findMany({
    where: { ativo: true, kind: "WORK" },
    select: { id: true, code: true, name: true, kind: true },
    orderBy: { code: "asc" },
  });

  const type = tid.type as TidType;
  const group = groupForType(type);
  const initialItems = tid.items.map((item) => itemToFormState(group, item));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar {tid.label}</h1>
        <p className="text-muted-foreground text-sm">
          O tipo, a origem e o destino não podem ser alterados. Para trocá-los, crie uma nova TID.
        </p>
      </div>
      <EditTidForm
        tidId={tid.id}
        type={type}
        originLabel={`${tid.originUnit.code} — ${tid.originUnit.name}`}
        destLabel={`${tid.destUnit.code} — ${tid.destUnit.name}`}
        initialReferenceMonth={formatYearMonth(tid.referenceMonth)}
        initialItems={initialItems}
        works={works}
      />
    </div>
  );
}
