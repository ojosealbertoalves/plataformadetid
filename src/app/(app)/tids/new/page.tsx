import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canCreateTid } from "@/lib/permissions";
import { NewTidForm } from "@/components/tid-form/new-tid-form";

export default async function NewTidPage() {
  const user = await requireUser();
  if (!canCreateTid(user)) {
    redirect("/dashboard");
  }

  const units = await prisma.unit.findMany({
    where: { ativo: true },
    select: { id: true, code: true, name: true, kind: true },
    orderBy: [{ kind: "asc" }, { code: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova TID</h1>
        <p className="text-muted-foreground text-sm">
          Preencha os dados e envie para a unidade de destino aprovar.
        </p>
      </div>
      <NewTidForm
        user={{
          role: user.role,
          unitId: user.unitId,
          unitCode: user.unitCode,
          unitName: user.unitName,
        }}
        units={units}
      />
    </div>
  );
}
