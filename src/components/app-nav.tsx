"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

interface NavUser {
  name: string;
  login: string;
  role: Role;
  unitName: string | null;
}

const UNIT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tids/new", label: "Nova TID" },
  { href: "/inbox", label: "Caixa de Entrada" },
];

const ADMIN_LINKS = [
  { href: "/admin/summary", label: "Resumo" },
  { href: "/admin/audit", label: "Auditoria" },
  { href: "/admin/assistant", label: "Assistente IA" },
];

export function AppNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const links = user.role === "ADMIN" ? ADMIN_LINKS : UNIT_LINKS;

  const roleLabel =
    user.role === "ADMIN" ? "Administrador" : user.role === "GERENTE_OBRA" ? "Gerente de Obras" : user.unitName ?? "Unidade";

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/dashboard" className="font-semibold whitespace-nowrap">
          Plataforma TID
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href))
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="text-right text-sm leading-tight">
            <div className="font-medium">{user.name}</div>
            <div className="text-muted-foreground text-xs">{roleLabel}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
