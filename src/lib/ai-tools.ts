import { prisma } from "@/lib/prisma";
import { parseYearMonth } from "@/lib/month";
import { fromCents } from "@/lib/money";
import { computeSummaryMatrix } from "@/lib/summary";
import { TID_TYPES, TID_TYPE_LABELS, type TidType } from "@/lib/constants";

/**
 * Camada de ferramentas do Assistente IA.
 *
 * O LLM NUNCA recebe acesso direto ao banco nem escreve SQL: ele apenas
 * escolhe qual destas funções pré-definidas chamar e com quais parâmetros.
 * O servidor executa a consulta (via Prisma, com filtros parametrizados) e
 * devolve números; o LLM só redige a resposta em cima desses números.
 */

async function resolveUnit(codeOrName: string) {
  const trimmed = codeOrName.trim();
  const unit = await prisma.unit.findFirst({
    where: {
      OR: [
        { code: { equals: trimmed } },
        { code: { contains: trimmed } },
        { name: { contains: trimmed } },
      ],
    },
    select: { id: true, code: true, name: true, kind: true },
  });
  return unit;
}

export const aiToolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "listar_unidades",
      description:
        "Lista todos os departamentos e obras cadastrados (código, nome e tipo). Use para descobrir o código exato de uma unidade citada pelo usuário.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "contar_tids",
      description:
        "Conta quantas TIDs existem, com filtros opcionais por unidade (origem ou destino), status e mês de referência.",
      parameters: {
        type: "object",
        properties: {
          unitCode: { type: "string", description: "Código ou nome da unidade (opcional)" },
          role: {
            type: "string",
            enum: ["origem", "destino", "qualquer"],
            description: "Papel da unidade na TID (padrão: qualquer)",
          },
          status: {
            type: "string",
            enum: ["PENDENTE", "APROVADA", "RECUSADA"],
            description: "Filtra por status (opcional)",
          },
          periodMonth: {
            type: "string",
            description: "Mês de referência no formato AAAA-MM (opcional)",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "somar_valor_por_tipo",
      description:
        "Soma o valor (em reais) das TIDs aprovadas de uma unidade, opcionalmente filtrando por tipo (A-F) e mês de referência.",
      parameters: {
        type: "object",
        properties: {
          unitCode: { type: "string", description: "Código ou nome da unidade" },
          role: {
            type: "string",
            enum: ["origem", "destino"],
            description: "Se soma o que a unidade enviou (origem) ou recebeu (destino). Padrão: origem.",
          },
          type: {
            type: "string",
            enum: [...TID_TYPES],
            description: "Tipo de TID (A=Encargos Diretos, B=Encargos Indiretos, C=Despesas Indiretas, D=Serviços de Terceiros, E=Equipamentos, F=Materiais). Opcional.",
          },
          periodMonth: { type: "string", description: "Mês de referência AAAA-MM (opcional)" },
        },
        required: ["unitCode"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "saldo_liquido",
      description:
        "Retorna o saldo líquido (creditado - debitado) de uma unidade em um tipo de TID específico — a mesma métrica usada na matriz-resumo do admin.",
      parameters: {
        type: "object",
        properties: {
          unitCode: { type: "string", description: "Código ou nome da unidade" },
          type: { type: "string", enum: [...TID_TYPES] },
          periodMonth: { type: "string", description: "Mês de referência AAAA-MM (opcional)" },
        },
        required: ["unitCode", "type"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ranking_unidades",
      description:
        "Retorna o ranking de unidades por uma métrica (quantidade de TIDs enviadas/recebidas/aprovadas/recusadas, ou valor total enviado/recebido).",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: [
              "tids_enviadas",
              "tids_recebidas",
              "tids_aprovadas",
              "tids_recusadas",
              "valor_enviado",
              "valor_recebido",
            ],
          },
          periodMonth: { type: "string", description: "Mês de referência AAAA-MM (opcional)" },
          limit: { type: "number", description: "Quantas unidades retornar no topo (padrão 5)" },
        },
        required: ["metric"],
        additionalProperties: false,
      },
    },
  },
] as const;

type ToolResult = Record<string, unknown>;

export async function executeAiTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case "listar_unidades": {
      const units = await prisma.unit.findMany({
        where: { ativo: true },
        select: { code: true, name: true, kind: true },
        orderBy: [{ kind: "asc" }, { code: "asc" }],
      });
      return { units };
    }

    case "contar_tids": {
      const unitCode = args.unitCode as string | undefined;
      const role = (args.role as string | undefined) ?? "qualquer";
      const status = args.status as string | undefined;
      const periodMonth = args.periodMonth as string | undefined;

      let unit = null;
      if (unitCode) {
        unit = await resolveUnit(unitCode);
        if (!unit) return { error: `Unidade "${unitCode}" não encontrada` };
      }

      const where: Record<string, unknown> = { isDeleted: false };
      if (status) where.status = status;
      if (periodMonth) where.referenceMonth = parseYearMonth(periodMonth);
      if (unit) {
        if (role === "origem") where.originUnitId = unit.id;
        else if (role === "destino") where.destUnitId = unit.id;
        else where.OR = [{ originUnitId: unit.id }, { destUnitId: unit.id }];
      }

      const count = await prisma.tid.count({ where });
      return { count, unit: unit?.code ?? null, role, status: status ?? "qualquer", periodMonth: periodMonth ?? "todos" };
    }

    case "somar_valor_por_tipo": {
      const unitCode = args.unitCode as string;
      const role = (args.role as string | undefined) ?? "origem";
      const type = args.type as TidType | undefined;
      const periodMonth = args.periodMonth as string | undefined;

      const unit = await resolveUnit(unitCode);
      if (!unit) return { error: `Unidade "${unitCode}" não encontrada` };

      const where: Record<string, unknown> = {
        isDeleted: false,
        status: "APROVADA",
        [role === "destino" ? "destUnitId" : "originUnitId"]: unit.id,
      };
      if (type) where.type = type;
      if (periodMonth) where.referenceMonth = parseYearMonth(periodMonth);

      const tids = await prisma.tid.findMany({
        where,
        select: { items: { select: { valorTidCents: true } } },
      });
      const totalCents = tids.reduce(
        (acc, t) => acc + t.items.reduce((a, i) => a + i.valorTidCents, 0),
        0
      );

      return {
        unit: unit.code,
        role,
        type: type ?? "todos",
        typeLabel: type ? TID_TYPE_LABELS[type] : "todos",
        periodMonth: periodMonth ?? "todos",
        totalReais: fromCents(totalCents),
      };
    }

    case "saldo_liquido": {
      const unitCode = args.unitCode as string;
      const type = args.type as TidType;
      const periodMonth = args.periodMonth as string | undefined;

      const unit = await resolveUnit(unitCode);
      if (!unit) return { error: `Unidade "${unitCode}" não encontrada` };

      const matrix = await computeSummaryMatrix(periodMonth);
      const row = matrix.find((r) => r.unitId === unit.id);
      if (!row) return { error: "Unidade sem dados" };

      return {
        unit: unit.code,
        type,
        typeLabel: TID_TYPE_LABELS[type],
        periodMonth: periodMonth ?? "todos",
        saldoReais: fromCents(row.byType[type]),
      };
    }

    case "ranking_unidades": {
      const metric = args.metric as string;
      const periodMonth = args.periodMonth as string | undefined;
      const limit = Math.min((args.limit as number | undefined) ?? 5, 20);

      if (metric === "valor_enviado" || metric === "valor_recebido") {
        const matrix = await computeSummaryMatrix(periodMonth);
        const isSent = metric === "valor_enviado";
        // Para valor enviado/recebido em módulo, recomputamos via TIDs diretamente.
        const where: Record<string, unknown> = { isDeleted: false, status: "APROVADA" };
        if (periodMonth) where.referenceMonth = parseYearMonth(periodMonth);
        const tids = await prisma.tid.findMany({
          where,
          select: {
            originUnitId: true,
            destUnitId: true,
            items: { select: { valorTidCents: true } },
          },
        });
        const totals = new Map<string, number>();
        for (const t of tids) {
          const value = t.items.reduce((a, i) => a + i.valorTidCents, 0);
          const key = isSent ? t.originUnitId : t.destUnitId;
          totals.set(key, (totals.get(key) ?? 0) + value);
        }
        const ranked = matrix
          .map((r) => ({ unit: r.unitCode, unitName: r.unitName, valueReais: fromCents(totals.get(r.unitId) ?? 0) }))
          .filter((r) => r.valueReais > 0)
          .sort((a, b) => b.valueReais - a.valueReais)
          .slice(0, limit);
        return { metric, periodMonth: periodMonth ?? "todos", ranking: ranked };
      }

      // Métricas de contagem
      const statusFilter =
        metric === "tids_aprovadas" ? "APROVADA" : metric === "tids_recusadas" ? "RECUSADA" : undefined;
      const byDest = metric === "tids_recebidas";

      const where: Record<string, unknown> = { isDeleted: false };
      if (statusFilter) where.status = statusFilter;
      if (periodMonth) where.referenceMonth = parseYearMonth(periodMonth);

      const tids = await prisma.tid.findMany({
        where,
        select: { originUnitId: true, destUnitId: true },
      });

      const counts = new Map<string, number>();
      for (const t of tids) {
        const unitId = byDest ? t.destUnitId : t.originUnitId;
        counts.set(unitId, (counts.get(unitId) ?? 0) + 1);
      }

      const units = await prisma.unit.findMany({
        where: { id: { in: [...counts.keys()] } },
        select: { id: true, code: true, name: true },
      });
      const unitMap = new Map(units.map((u) => [u.id, u]));

      const ranked = [...counts.entries()]
        .map(([unitId, count]) => {
          const unit = unitMap.get(unitId);
          return { unit: unit?.code ?? unitId, unitName: unit?.name ?? "?", count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return { metric, periodMonth: periodMonth ?? "todos", ranking: ranked };
    }

    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}
