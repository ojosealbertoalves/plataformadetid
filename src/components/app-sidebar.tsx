"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";
import {
  LayoutDashboard,
  FilePlus2,
  Inbox,
  BarChart3,
  History,
  Bot,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const UNIT_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tids/new", label: "Nova TID", icon: FilePlus2 },
  { href: "/inbox", label: "Caixa de Entrada", icon: Inbox },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/summary", label: "Resumo", icon: BarChart3 },
  { href: "/admin/audit", label: "Histórico", icon: History },
  { href: "/admin/assistant", label: "Assistente IA", icon: Bot },
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? ADMIN_LINKS : UNIT_LINKS;

  return (
    <aside className="bg-sidebar border-sidebar-border flex w-16 shrink-0 flex-col border-r md:w-60">
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="mx-auto size-4 shrink-0 md:mx-0" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
