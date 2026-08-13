import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import type { Session } from "next-auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApiUser(): Promise<Session["user"]> {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Não autenticado");
  }
  return session.user;
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: err.issues },
      { status: 400 }
    );
  }
  console.error(err);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
