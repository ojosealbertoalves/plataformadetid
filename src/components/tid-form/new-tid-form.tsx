"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemRow } from "./item-row";
import {
  FIELDS_BY_GROUP,
  emptyItem,
  groupForType,
  serializeItem,
  type FieldGroup,
} from "@/lib/tid-form-fields";
import { TID_TYPES, TID_TYPE_LABELS, TYPES_WITH_ITEM_LEVEL_MONTH, type TidType } from "@/lib/constants";
import { Copy, Plus } from "lucide-react";

interface UnitOption {
  id: string;
  code: string;
  name: string;
  kind: string;
}

interface SessionUserLike {
  role: "ADMIN" | "GERENTE_OBRA" | "UNIDADE";
  unitId: string | null;
  unitCode: string | null;
  unitName: string | null;
}

export function NewTidForm({ user, units }: { user: SessionUserLike; units: UnitOption[] }) {
  const router = useRouter();
  const [type, setType] = useState<TidType>("C");
  const [originUnitId, setOriginUnitId] = useState<string>(
    user.role === "UNIDADE" ? (user.unitId ?? "") : ""
  );
  const [destUnitId, setDestUnitId] = useState<string>("");
  const [referenceMonth, setReferenceMonth] = useState<string>("");
  const [items, setItems] = useState<Record<string, string>[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);

  const group: FieldGroup = groupForType(type);
  const works = useMemo(() => units.filter((u) => u.kind === "WORK"), [units]);

  const originOptions = user.role === "GERENTE_OBRA" ? works : units;
  const destOptions = (user.role === "GERENTE_OBRA" ? works : units).filter(
    (u) => u.id !== originUnitId
  );

  const typeItems = useMemo(
    () => Object.fromEntries(TID_TYPES.map((t) => [t, `${t} — ${TID_TYPE_LABELS[t]}`])),
    []
  );
  const originItems = useMemo(
    () => Object.fromEntries(originOptions.map((u) => [u.id, `${u.code} — ${u.name}`])),
    [originOptions]
  );
  const destItems = useMemo(
    () => Object.fromEntries(destOptions.map((u) => [u.id, `${u.code} — ${u.name}`])),
    [destOptions]
  );

  function updateItem(index: number, key: string, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function replicateFirst() {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      const first = prev[0];
      return prev.map((it, i) => (i === 0 ? it : { ...first }));
    });
    toast.success("Dados do primeiro item replicados para os demais.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!originUnitId || !destUnitId) {
      toast.error("Selecione origem e destino.");
      return;
    }
    if (originUnitId === destUnitId) {
      toast.error("Origem e destino não podem ser a mesma unidade.");
      return;
    }
    const needsMonth = !TYPES_WITH_ITEM_LEVEL_MONTH.includes(type);
    if (needsMonth && !referenceMonth) {
      toast.error("Informe o mês de referência da TID.");
      return;
    }

    const payload = {
      type,
      originUnitId,
      destUnitId,
      referenceMonth: needsMonth ? referenceMonth : undefined,
      items: items.map((it) => serializeItem(group, it)),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/tids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const issue = data.issues?.[0]?.message;
        toast.error(issue || data.error || "Erro ao criar TID");
        setSubmitting(false);
        return;
      }
      toast.success(`TID ${data.tid.label} criada com sucesso.`);
      router.push(`/tids/${data.tid.id}`);
      router.refresh();
    } catch {
      toast.error("Erro de rede ao criar TID");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da TID</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TidType)} items={typeItems}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TID_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t} — {TID_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            {user.role === "UNIDADE" ? (
              <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">
                {user.unitCode} — {user.unitName}
              </div>
            ) : (
              <Select
                value={originUnitId}
                onValueChange={(v) => setOriginUnitId(v ?? "")}
                items={originItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a obra de origem" />
                </SelectTrigger>
                <SelectContent>
                  {originOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code} — {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Destino</Label>
            <Select
              value={destUnitId}
              onValueChange={(v) => setDestUnitId(v ?? "")}
              items={destItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                {destOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.code} — {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!TYPES_WITH_ITEM_LEVEL_MONTH.includes(type) && (
            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <input
                type="month"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Itens ({FIELDS_BY_GROUP[group].length > 0 ? items.length : 0})
        </h2>
        <div className="flex gap-2">
          {items.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={replicateFirst}>
              <Copy className="mr-1 size-4" />
              Replicar 1º item para os demais
            </Button>
          )}
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="mr-1 size-4" />
            Adicionar item
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <ItemRow
            key={index}
            index={index}
            group={group}
            item={item}
            onChange={(key, value) => updateItem(index, key, value)}
            onRemove={() => removeItem(index)}
            canRemove={items.length > 1}
            works={works}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar TID"}
        </Button>
      </div>
    </form>
  );
}
