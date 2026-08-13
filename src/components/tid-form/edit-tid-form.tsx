"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemRow } from "./item-row";
import { emptyItem, groupForType, serializeItem, type FieldGroup } from "@/lib/tid-form-fields";
import { TID_TYPE_LABELS, TYPES_WITH_ITEM_LEVEL_MONTH, type TidType } from "@/lib/constants";
import { Copy, Plus } from "lucide-react";

interface UnitOption {
  id: string;
  code: string;
  name: string;
  kind: string;
}

export function EditTidForm({
  tidId,
  type,
  originLabel,
  destLabel,
  initialReferenceMonth,
  initialItems,
  works,
}: {
  tidId: string;
  type: TidType;
  originLabel: string;
  destLabel: string;
  initialReferenceMonth: string;
  initialItems: Record<string, string>[];
  works: UnitOption[];
}) {
  const router = useRouter();
  const [referenceMonth, setReferenceMonth] = useState(initialReferenceMonth);
  const [items, setItems] = useState<Record<string, string>[]>(
    initialItems.length > 0 ? initialItems : [emptyItem()]
  );
  const [submitting, setSubmitting] = useState(false);

  const group: FieldGroup = groupForType(type);
  const needsMonth = !TYPES_WITH_ITEM_LEVEL_MONTH.includes(type);

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
    if (needsMonth && !referenceMonth) {
      toast.error("Informe o mês de referência da TID.");
      return;
    }

    const payload = {
      type,
      referenceMonth: needsMonth ? referenceMonth : undefined,
      items: items.map((it) => serializeItem(group, it)),
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tids/${tidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const issue = data.issues?.[0]?.message;
        toast.error(issue || data.error || "Erro ao salvar TID");
        setSubmitting(false);
        return;
      }
      toast.success("TID atualizada com sucesso.");
      router.push(`/tids/${tidId}`);
      router.refresh();
    } catch {
      toast.error("Erro de rede ao salvar TID");
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
            <Label className="text-muted-foreground">Tipo</Label>
            <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">
              {type} — {TID_TYPE_LABELS[type]}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Origem</Label>
            <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">
              {originLabel}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Destino</Label>
            <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">
              {destLabel}
            </div>
          </div>
          {needsMonth && (
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
        <h2 className="text-lg font-semibold">Itens ({items.length})</h2>
        <div className="flex gap-2">
          {items.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={replicateFirst}>
              <Copy className="mr-1 size-4" />
              Replicar 1º item para os demais
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
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
          {submitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
