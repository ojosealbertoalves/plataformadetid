import { cn } from "@/lib/utils";
import { TID_STATUS_LABELS, type TidStatus } from "@/lib/constants";

const STATUS_CLASSES: Record<TidStatus, string> = {
  APROVADA: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  RECUSADA: "bg-red-500/15 text-red-400 border-red-500/30",
  PENDENTE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status as TidStatus;
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[key] ?? "bg-secondary text-secondary-foreground border-transparent",
        className
      )}
    >
      {TID_STATUS_LABELS[key] ?? status}
    </span>
  );
}
