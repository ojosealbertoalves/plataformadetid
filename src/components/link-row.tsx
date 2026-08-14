"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Linha de tabela inteira clicável, navegando para `href` ao ser clicada. */
export function LinkRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <TableRow
      onClick={() => router.push(href)}
      className={cn("cursor-pointer hover:bg-accent/50", className)}
    >
      {children}
    </TableRow>
  );
}
