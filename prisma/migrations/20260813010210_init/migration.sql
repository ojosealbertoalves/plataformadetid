-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "unitId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "lastTidNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originUnitId" TEXT NOT NULL,
    "destUnitId" TEXT NOT NULL,
    "referenceMonth" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdById" TEXT NOT NULL,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Tid_originUnitId_fkey" FOREIGN KEY ("originUnitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tid_destUnitId_fkey" FOREIGN KEY ("destUnitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tid_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TidItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tidId" TEXT NOT NULL,
    "observacao" TEXT,
    "funcionario" TEXT,
    "mesReferencia" DATETIME,
    "funcao" TEXT,
    "centroCusto" TEXT,
    "localOrigem" TEXT,
    "localTrabalho" TEXT,
    "qtdeDias" INTEGER,
    "valorFolhaCents" INTEGER,
    "encargos80Cents" INTEGER,
    "totalGeralCents" INTEGER,
    "item" TEXT,
    "localUtilizacao" TEXT,
    "obraUauId" TEXT,
    "procUau" TEXT,
    "fornecedor" TEXT,
    "docFiscal" TEXT,
    "valorNfCents" INTEGER,
    "quantidade" REAL,
    "valorUnitOriginalCents" INTEGER,
    "valorDepreciacaoCents" INTEGER,
    "valorTidCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TidItem_tidId_fkey" FOREIGN KEY ("tidId") REFERENCES "Tid" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TidItem_obraUauId_fkey" FOREIGN KEY ("obraUauId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TidComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tidId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TidComment_tidId_fkey" FOREIGN KEY ("tidId") REFERENCES "Tid" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TidComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tidId" TEXT,
    "tidItemId" TEXT,
    "fileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_tidId_fkey" FOREIGN KEY ("tidId") REFERENCES "Tid" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_tidItemId_fkey" FOREIGN KEY ("tidItemId") REFERENCES "TidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_unitId_key" ON "User"("unitId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE INDEX "Unit_kind_idx" ON "Unit"("kind");

-- CreateIndex
CREATE INDEX "Tid_originUnitId_idx" ON "Tid"("originUnitId");

-- CreateIndex
CREATE INDEX "Tid_destUnitId_idx" ON "Tid"("destUnitId");

-- CreateIndex
CREATE INDEX "Tid_status_idx" ON "Tid"("status");

-- CreateIndex
CREATE INDEX "Tid_referenceMonth_idx" ON "Tid"("referenceMonth");

-- CreateIndex
CREATE INDEX "Tid_type_idx" ON "Tid"("type");

-- CreateIndex
CREATE INDEX "Tid_isDeleted_idx" ON "Tid"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Tid_originUnitId_number_key" ON "Tid"("originUnitId", "number");

-- CreateIndex
CREATE INDEX "TidItem_tidId_idx" ON "TidItem"("tidId");

-- CreateIndex
CREATE INDEX "TidItem_obraUauId_idx" ON "TidItem"("obraUauId");

-- CreateIndex
CREATE INDEX "TidComment_tidId_idx" ON "TidComment"("tidId");

-- CreateIndex
CREATE INDEX "Attachment_tidId_idx" ON "Attachment"("tidId");

-- CreateIndex
CREATE INDEX "Attachment_tidItemId_idx" ON "Attachment"("tidItemId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
