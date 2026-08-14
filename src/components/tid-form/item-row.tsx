"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FIELDS_BY_GROUP,
  computePreview,
  type FieldGroup,
} from "@/lib/tid-form-fields";
import { formatBRLFromValue } from "@/lib/money";

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export function ItemRow({
  index,
  group,
  item,
  onChange,
  onRemove,
  canRemove,
  works,
}: {
  index: number;
  group: FieldGroup;
  item: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  works: UnitOption[];
}) {
  const fields = FIELDS_BY_GROUP[group];
  const preview = computePreview(group, item);
  const obraUauItems = Object.fromEntries(works.map((w) => [w.id, `${w.code} — ${w.name}`]));

  return (
    <Card className="border-t-brand/60 border-t-2">
      <CardHeader className="bg-muted/30 flex flex-row items-center justify-between border-b py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-brand flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white">
            {index + 1}
          </span>
          Item {index + 1}
        </span>
        {canRemove && (
          <Button variant="ghost" size="icon" className="size-7" onClick={onRemove} type="button">
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const spanClass =
            field.colSpan === 3
              ? "sm:col-span-2 lg:col-span-3"
              : field.colSpan === 2
                ? "sm:col-span-2 lg:col-span-2"
                : "";

          if (field.computed) {
            const previewValue = (preview as Record<string, number>)[field.key];
            return (
              <div key={field.key} className={cn("space-y-2", spanClass)}>
                <Label className="text-muted-foreground flex items-center gap-1.5">
                  {field.label}
                  <span className="border-brand-support-2/40 text-brand-support-1 rounded-full border px-1.5 py-0 text-[10px] font-normal tracking-wide uppercase">
                    Automático
                  </span>
                </Label>
                <div className="border-brand-support-2/30 bg-brand/10 text-foreground h-9 rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums">
                  {previewValue !== undefined ? formatBRLFromValue(previewValue) : "—"}
                </div>
              </div>
            );
          }

          if (field.kind === "obra-uau") {
            return (
              <div key={field.key} className={cn("space-y-2", spanClass)}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Select
                  value={item[field.key] ?? ""}
                  onValueChange={(v) => onChange(field.key, v ?? "")}
                  items={obraUauItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {works.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.kind === "textarea") {
            return (
              <div key={field.key} className={cn("space-y-2", spanClass)}>
                <Label>{field.label}</Label>
                <Textarea
                  value={item[field.key] ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  rows={2}
                />
              </div>
            );
          }

          const inputType =
            field.kind === "money" || field.kind === "number"
              ? "number"
              : field.kind === "int"
                ? "number"
                : field.kind === "month"
                  ? "month"
                  : "text";

          return (
            <div key={field.key} className={cn("space-y-2", spanClass)}>
              <Label>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                type={inputType}
                step={field.kind === "money" ? "0.01" : field.kind === "int" ? "1" : "0.001"}
                min={field.kind === "money" || field.kind === "number" || field.kind === "int" ? 0 : undefined}
                value={item[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
