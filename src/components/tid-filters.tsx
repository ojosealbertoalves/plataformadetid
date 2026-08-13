"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TID_STATUSES, TID_STATUS_LABELS, TID_TYPES, TID_TYPE_LABELS } from "@/lib/constants";

const ALL = "__all__";

export function TidFilters({
  showType = true,
  showStatus = true,
}: {
  showType?: boolean;
  showStatus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const month = searchParams.get("month") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="month"
        value={month}
        onChange={(e) => setParam("month", e.target.value)}
        className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
      />
      {showType && (
        <Select value={searchParams.get("type") ?? ALL} onValueChange={(v) => setParam("type", v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {TID_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t} — {TID_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showStatus && (
        <Select
          value={searchParams.get("status") ?? ALL}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {TID_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TID_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {(month || searchParams.get("type") || searchParams.get("status")) && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
