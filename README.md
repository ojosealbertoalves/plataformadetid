# Plataforma TID — Vila Brasil Engenharia

Sistema interno para solicitação e controle de **TID (Transferência Interna de Despesa)**.
MVP full-stack em Next.js (App Router), pronto para operação real, rodando em
PostgreSQL tanto em desenvolvimento quanto em produção (deploy no Railway).

## Stack

- Next.js (App Router) + TypeScript — UI e API routes no mesmo projeto
- Prisma ORM — PostgreSQL em dev e produção (mesmo schema, mesmo provider)
- Auth.js (NextAuth v5) — login/senha com Credentials Provider, senha em bcrypt
- Tailwind CSS + shadcn/ui
- SheetJS (`xlsx`) — exportação Excel/CSV/TXT no servidor
- Assistente IA via OpenRouter, com ferramentas parametrizadas (sem SQL livre para o modelo)
- Docker Compose com PostgreSQL, para desenvolvimento local

## Pré-requisitos

- Node.js 20+
- npm
- Docker (para o Postgres local via `docker-compose.yml`) — ou acesso a um Postgres já existente

## Setup (primeira vez)

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# O padrão em .env.example já aponta para o Postgres do docker-compose (passo 3)

# 3. Subir o PostgreSQL local
docker compose up -d

# 4. Rodar as migrations (cria as tabelas no Postgres local)
npx prisma migrate dev

# 5. Popular o banco com as unidades, obras e usuários padrão
npm run db:seed

# 6. Subir em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

Se preferir não usar Docker, aponte `DATABASE_URL` em `.env` para qualquer outro
Postgres de desenvolvimento (local ou um serviço gerenciado) e siga a partir do
passo 4.

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

> **Atenção (Railway):** o filesystem do Railway é efêmero — qualquer arquivo salvo em
> `/uploads` é perdido a cada novo deploy/restart do container. Enquanto o storage em
> nuvem (S3) não for implementado, não confie em anexos enviados em produção para
> persistirem a longo prazo.

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

## Deploy no Railway

1. **Criar o projeto**: no [Railway](https://railway.app), "New Project" → "Deploy from
   GitHub repo" → selecione este repositório.
2. **Adicionar o PostgreSQL**: no mesmo projeto Railway, "New" → "Database" → "Add
   PostgreSQL". Isso cria um serviço de banco com uma `DATABASE_URL` própria.
3. **Configurar as variáveis** no serviço da aplicação (aba "Variables"):
   - `DATABASE_URL` → referencie a URL do serviço Postgres criado no passo 2 (no
     Railway, use a referência de variável, ex.: `${{Postgres.DATABASE_URL}}`, para que
     fique sempre em sincronia — não copie o valor manualmente).
   - `NEXTAUTH_SECRET` → gere com `openssl rand -base64 32` e cole o valor.
   - `NEXTAUTH_URL` → a URL pública do serviço, ex.: `https://<app>.up.railway.app`
     (o Railway atribui esse domínio após o primeiro deploy; edite a variável depois de
     descobrir a URL, ou configure um domínio customizado antes).
   - `OPENROUTER_API_KEY` → deixe vazio por enquanto (assistente IA fica desabilitado).
4. **Deploy**: o Railway detecta o projeto Next.js via Nixpacks automaticamente
   (`railway.json` incluso fixa o comando de start). No build, `npm install` roda
   `prisma generate` (via `postinstall`) e `npm run build` gera o build de produção. No
   start, `npm run start` roda `prisma migrate deploy` (cria/atualiza as tabelas no
   Postgres do Railway) seguido de `prisma db seed` (popula unidades, obras e usuários —
   é idempotente, usa `upsert`, então não duplica em deploys seguintes) e só então inicia
   `next start` na porta que o Railway injeta (`$PORT`).
5. **Confirmar**: acompanhe os logs do deploy — devem aparecer as migrations sendo
   aplicadas e o log do seed ("Seedando..."). Acesse a URL pública e faça login com um
   dos usuários de teste abaixo.

### Rodar o seed manualmente (se precisar)

Com `DATABASE_URL` apontando para o banco desejado:

```bash
npx prisma db seed
```

É seguro rodar quantas vezes quiser — todos os registros usam `upsert` por chave única
(`login`/`code`), então não duplica nem sobrescreve dados que já existem.

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
