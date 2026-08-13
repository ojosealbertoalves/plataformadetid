import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, UnitKind } from "@/lib/constants";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const login = credentials?.login;
        const password = credentials?.password;
        if (typeof login !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { login: login.trim() },
          include: { unit: true },
        });
        if (!user || !user.ativo) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role as Role,
          unitId: user.unitId,
          unitCode: user.unit?.code ?? null,
          unitName: user.unit?.name ?? null,
          unitKind: (user.unit?.kind as UnitKind | undefined) ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id!;
        token.login = user.login;
        token.role = user.role;
        token.unitId = user.unitId;
        token.unitCode = user.unitCode;
        token.unitName = user.unitName;
        token.unitKind = user.unitKind;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.login = token.login;
      session.user.role = token.role;
      session.user.unitId = token.unitId;
      session.user.unitCode = token.unitCode;
      session.user.unitName = token.unitName;
      session.user.unitKind = token.unitKind;
      return session;
    },
  },
});
