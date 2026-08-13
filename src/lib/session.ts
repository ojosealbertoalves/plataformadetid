import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "./constants";

export async function getSession() {
  return auth();
}

/** Garante que há um usuário autenticado; redireciona para /login caso contrário. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/** Garante que o usuário autenticado tem um dos papéis informados. */
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
