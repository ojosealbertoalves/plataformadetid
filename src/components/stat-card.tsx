import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string | number;
  caption?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  return (
    <Card
      className={cn(
        "border-l-2",
        tone === "positive" && "border-l-emerald-500",
        tone === "negative" && "border-l-red-500",
        tone === "warning" && "border-l-amber-500",
        (!tone || tone === "default") && "border-l-brand-support-2"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold tabular-nums",
            tone === "positive" && "text-emerald-400",
            tone === "negative" && "text-red-400",
            tone === "warning" && "text-amber-400"
          )}
        >
          {value}
        </div>
        {caption && <p className="text-muted-foreground mt-1 text-xs">{caption}</p>}
      </CardContent>
    </Card>
  );
}
