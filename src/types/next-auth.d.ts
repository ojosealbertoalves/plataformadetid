import type { Role, UnitKind } from "@/lib/constants";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    login: string;
    role: Role;
    unitId: string | null;
    unitCode: string | null;
    unitName: string | null;
    unitKind: UnitKind | null;
  }

  interface Session {
    user: {
      id: string;
      login: string;
      role: Role;
      unitId: string | null;
      unitCode: string | null;
      unitName: string | null;
      unitKind: UnitKind | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid: string;
    login: string;
    role: Role;
    unitId: string | null;
    unitCode: string | null;
    unitName: string | null;
    unitKind: UnitKind | null;
  }
}
