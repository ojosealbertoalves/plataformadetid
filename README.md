# Plataforma TID — Vila Brasil Engenharia

Sistema interno para solicitação e controle de **TID (Transferência Interna de Despesa)**.
MVP full-stack em Next.js (App Router), pronto para operação real e rodando 100% local,
com a arquitetura já preparada para deploy futuro (troca de SQLite para PostgreSQL sem
reescrever código).

## Stack

- Next.js (App Router) + TypeScript — UI e API routes no mesmo projeto
- Prisma ORM — SQLite em dev, PostgreSQL no deploy (mesmo schema)
- Auth.js (NextAuth v5) — login/senha com Credentials Provider, senha em bcrypt
- Tailwind CSS + shadcn/ui
- SheetJS (`xlsx`) — exportação Excel/CSV/TXT no servidor
- Assistente IA via OpenRouter, com ferramentas parametrizadas (sem SQL livre para o modelo)
- Docker Compose com PostgreSQL, para o dia do deploy

## Pré-requisitos

- Node.js 20+
- npm

## Setup (primeira vez)

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# Edite .env se quiser (o padrão já funciona 100% local com SQLite)

# 3. Rodar as migrations (cria o arquivo prisma/dev.db)
npx prisma migrate dev

# 4. Popular o banco com as unidades, obras e usuários padrão
npm run db:seed

# 5. Subir em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Contas de acesso (seed)

Todas as contas usam a senha padrão **`mudar123`** — troque antes de usar em produção.

| Papel | Login | Observação |
|---|---|---|
| Administrador | `admin` | Gerencia tudo, não cria/aprova TID |
| Gerente de Obras | `gerente` | Único perfil, enxerga/gerencia todas as obras |
| Departamento | `MKT`, `COM`, `DIR`, `PRO`, `INC`, `NNV`, `DEIM`, `TST1`, `TST2` | Login = código do departamento |
| Obra | `157`, `158`, `179`, `186`, `188`, `192A`, `192B`, `194`, `207`, `228`, `229`, `241`, `242`, `257`, `328`, `329`, `420`, `500` | Login = código da obra |

`TST1` e `TST2` são departamentos de teste para validar o fluxo completo de envio/aprovação/recusa entre unidades.

## Scripts úteis

```bash
npm run dev          # servidor de desenvolvimento
npm run build         # build de produção
npm run start         # servidor de produção (após build)
npm run lint           # eslint
npm run db:seed        # roda o seed novamente (idempotente, usa upsert)
npm run db:migrate     # cria/aplica uma nova migration em dev
npm run db:studio      # abre o Prisma Studio (navegar/editar dados manualmente)
```

## Estrutura de pastas (resumo)

```
prisma/
  schema.prisma       # modelo de dados (comentado com notas de portabilidade)
  seed.ts              # unidades, obras, admin, gerente
src/
  app/
    login/              # login público
    (app)/              # rotas protegidas (exige sessão)
      dashboard/         # dashboard de unidade/gerente
      tids/new/           # criação de TID
      tids/[id]/           # detalhe/edição de TID
      inbox/                # caixa de entrada (aprovar/recusar)
      admin/summary/        # matriz de saldo líquido + drill-down (admin)
      admin/audit/           # histórico de auditoria (admin)
      admin/assistant/        # assistente IA (admin)
    api/                  # rotas de API (TID, aprovação, resumo, export, assistente...)
  lib/                    # regras de negócio: permissões, cálculos, trava de mês, etc.
uploads/                  # anexos de nota fiscal (criado em runtime)
```

## Anexos de nota fiscal

Os anexos são salvos localmente em `/uploads` através da interface `StorageProvider`
(`src/lib/storage.ts`). Para migrar para S3 no deploy, basta implementar essa mesma
interface com um `S3StorageProvider` e trocar a instância exportada — nenhuma outra
parte do código precisa mudar.

## Assistente IA (OpenRouter)

A aba **Assistente IA** (exclusiva do admin) fica desabilitada até que você configure:

```
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="openai/gpt-4o-mini"   # ou outro modelo disponível no OpenRouter
```

O modelo **nunca** recebe acesso direto ao banco nem escreve SQL: ele apenas escolhe,
entre um conjunto fixo de ferramentas parametrizadas (`src/lib/ai-tools.ts`), qual chamar
e com quais parâmetros. O servidor executa a consulta via Prisma e devolve números; o
modelo só redige a resposta em cima desses números.

## Migrando de SQLite para PostgreSQL (deploy)

O schema já foi desenhado para ser idêntico nos dois bancos (sem `Decimal` nem `enum`
nativos, que o SQLite não suporta — veja o comentário no topo de `prisma/schema.prisma`).
Para migrar:

1. Suba um PostgreSQL (o `docker-compose.yml` incluso já sobe um local para testes):
   ```bash
   docker compose up -d
   ```
2. No `prisma/schema.prisma`, troque:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   por:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Atualize `DATABASE_URL` no `.env` para a string de conexão do Postgres, por exemplo:
   ```
   DATABASE_URL="postgresql://tid:tid@localhost:5432/plataforma_tid?schema=public"
   ```
4. Rode as migrations no novo banco e o seed:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

Nenhuma outra alteração de código é necessária — toda a camada de aplicação (queries,
cálculos, valores em centavos) já é agnóstica ao provider do banco.

## Regras de negócio principais

- **Papéis:** `ADMIN` (gerencia tudo, não opera TIDs, único com export/IA), `GERENTE_OBRA`
  (um único login, atua sobre todas as obras, TIDs que ele cria já nascem aprovadas),
  `UNIDADE` (departamentos e obras, cada um com login próprio).
- **Numeração:** sequencial por unidade de origem (`MKT-01`, `194-01`...), gerada de forma
  atômica dentro de uma transação.
- **Cálculos (sempre recalculados no servidor, nunca confiando no cliente):**
  - Tipos A/B: `Encargos 80% = Valor TID × 0,80`; `Total Geral = Valor TID + Encargos 80%`.
  - Tipos E/F: `Valor TID = Quantidade × (Valor Unit. Original − Valor da Depreciação)`.
- **Trava de mês:** apenas o `ADMIN` pode editar/excluir uma TID cujo mês de referência já
  não seja o mês corrente.
- **Resumo do admin:** saldo líquido = valor creditado (origem) − valor debitado (destino),
  somando apenas TIDs **aprovadas**, com drill-down por unidade × tipo.
- **Auditoria:** toda criação, edição, aprovação, recusa e exclusão fica registrada em
  `AuditLog`; exclusões são lógicas (soft-delete), nada é apagado de verdade.
