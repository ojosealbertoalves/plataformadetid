import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "mudar123";

const DEPARTMENTS: { code: string; name: string }[] = [
  { code: "MKT", name: "Marketing" },
  { code: "COM", name: "Comercial" },
  { code: "DIR", name: "Direto" },
  { code: "PRO", name: "Projetos" },
  { code: "INC", name: "Incorporação" },
  { code: "NNV", name: "Novos Negócios Vila Brasil" },
  { code: "DEIM", name: "Desenvolvimento de Produto" },
  { code: "TST1", name: "Teste 1" },
  { code: "TST2", name: "Teste 2" },
];

const WORKS: { code: string; name: string }[] = [
  { code: "157", name: "Bela Vista Residencial" },
  { code: "158", name: "Parque dos Ipês" },
  { code: "179", name: "Porto Maranata" },
  { code: "186", name: "Porto Jacarandá" },
  { code: "188", name: "Porto Horizonte" },
  { code: "192A", name: "Porto Jatobá 1" },
  { code: "192B", name: "Porto Jatobá 2" },
  { code: "194", name: "Porto Araras I" },
  { code: "207", name: "Porto Quaresmeiras I" },
  { code: "228", name: "Porto Araras II" },
  { code: "229", name: "Porto Quaresmeiras II" },
  { code: "241", name: "Porto Flamboyant I" },
  { code: "242", name: "Porto Flamboyant 2" },
  { code: "257", name: "Porto Belvedere I" },
  { code: "328", name: "Porto Bougainville I" },
  { code: "329", name: "Porto Bougainville II" },
  { code: "420", name: "Porto Gramado" },
  { code: "500", name: "Porto Belvedere II" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("Seedando unidades (departamentos)...");
  for (const dept of DEPARTMENTS) {
    const unit = await prisma.unit.upsert({
      where: { code: dept.code },
      update: { name: dept.name, kind: "DEPARTMENT" },
      create: { code: dept.code, name: dept.name, kind: "DEPARTMENT" },
    });
    await prisma.user.upsert({
      where: { login: dept.code },
      update: {},
      create: {
        login: dept.code,
        name: dept.name,
        passwordHash,
        role: "UNIDADE",
        unitId: unit.id,
      },
    });
  }

  console.log("Seedando unidades (obras)...");
  for (const work of WORKS) {
    const unit = await prisma.unit.upsert({
      where: { code: work.code },
      update: { name: work.name, kind: "WORK" },
      create: { code: work.code, name: work.name, kind: "WORK" },
    });
    await prisma.user.upsert({
      where: { login: work.code },
      update: {},
      create: {
        login: work.code,
        name: work.name,
        passwordHash,
        role: "UNIDADE",
        unitId: unit.id,
      },
    });
  }

  console.log("Seedando conta ADMIN...");
  await prisma.user.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      login: "admin",
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
      unitId: null,
    },
  });

  console.log("Seedando conta GERENTE_OBRA...");
  await prisma.user.upsert({
    where: { login: "gerente" },
    update: {},
    create: {
      login: "gerente",
      name: "Gerente de Obras",
      passwordHash,
      role: "GERENTE_OBRA",
      unitId: null,
    },
  });

  console.log("Seed concluído.");
  console.log(`Senha padrão de todos os usuários: "${DEFAULT_PASSWORD}" (troque em produção).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
