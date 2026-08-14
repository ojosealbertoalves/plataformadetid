"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/constants";

interface NavUser {
  name: string;
  login: string;
  role: Role;
  unitName: string | null;
}

export function AppNav({ user }: { user: NavUser }) {
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrador"
      : user.role === "GERENTE_OBRA"
        ? "Gerente de Obras"
        : (user.unitName ?? "Unidade");

  return (
    <header className="bg-brand shrink-0">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Vila Brasil Engenharia"
            width={40}
            height={40}
            className="size-9 rounded-md sm:size-10"
            priority
          />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold text-white">Plataforma TID</div>
            <div className="text-brand-support-1 text-[11px]">Vila Brasil Engenharia</div>
          </div>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-sm leading-tight sm:block">
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-brand-support-1 text-xs">{roleLabel}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
