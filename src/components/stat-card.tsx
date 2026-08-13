import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  count,
  valueLabel,
  tone,
}: {
  label: string;
  count: number;
  valueLabel: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            tone === "positive" && "text-emerald-600 dark:text-emerald-400",
            tone === "negative" && "text-red-600 dark:text-red-400",
            tone === "warning" && "text-amber-600 dark:text-amber-400"
          )}
        >
          {count}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{valueLabel}</p>
      </CardContent>
    </Card>
  );
}
