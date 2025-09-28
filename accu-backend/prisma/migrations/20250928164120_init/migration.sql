-- CreateTable
CREATE TABLE "accu_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "acquisitionCost" REAL NOT NULL,
    "classification" TEXT NOT NULL,
    "acquisitionDate" DATETIME NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "loanStatus" BOOLEAN NOT NULL DEFAULT false,
    "loanDetails" JSONB,
    CONSTRAINT "accu_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accu_batches_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "valuation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "marketPrice" REAL NOT NULL,
    "nrv" REAL NOT NULL,
    "impairment" REAL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "valuation_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accu_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "valuation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "audit_log_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_log_entries_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "accu_batches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "debit" REAL NOT NULL,
    "credit" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "journal_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "xbrl_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "xbrl_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reclassification_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "reclassification_requests_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accu_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reclassification_requests_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "commodityType" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "preferences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "entityId" TEXT,
    CONSTRAINT "users_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "preferences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "address" JSONB,
    "contactInfo" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "parentId" TEXT
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "loanAmount" REAL NOT NULL,
    "buybackRate" REAL,
    "buybackDate" DATETIME,
    "loanStatus" TEXT NOT NULL DEFAULT 'active',
    "collateralValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "loans_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accu_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loans_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "creditors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "loans_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "creditors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" JSONB,
    "terms" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "import_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "accu_batches_batchNumber_key" ON "accu_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "accu_batches_entityId_idx" ON "accu_batches"("entityId");

-- CreateIndex
CREATE INDEX "accu_batches_status_idx" ON "accu_batches"("status");

-- CreateIndex
CREATE INDEX "valuation_logs_batchId_idx" ON "valuation_logs"("batchId");

-- CreateIndex
CREATE INDEX "valuation_logs_date_idx" ON "valuation_logs"("date");

-- CreateIndex
CREATE INDEX "audit_log_entries_userId_idx" ON "audit_log_entries"("userId");

-- CreateIndex
CREATE INDEX "audit_log_entries_timestamp_idx" ON "audit_log_entries"("timestamp");

-- CreateIndex
CREATE INDEX "journal_entries_entityId_idx" ON "journal_entries"("entityId");

-- CreateIndex
CREATE INDEX "journal_lines_entryId_idx" ON "journal_lines"("entryId");

-- CreateIndex
CREATE INDEX "xbrl_tags_entityId_idx" ON "xbrl_tags"("entityId");

-- CreateIndex
CREATE INDEX "reclassification_requests_batchId_idx" ON "reclassification_requests"("batchId");

-- CreateIndex
CREATE INDEX "reclassification_requests_status_idx" ON "reclassification_requests"("status");

-- CreateIndex
CREATE INDEX "market_prices_date_idx" ON "market_prices"("date");

-- CreateIndex
CREATE INDEX "market_prices_entityId_idx" ON "market_prices"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "entities_parentId_idx" ON "entities"("parentId");

-- CreateIndex
CREATE INDEX "loans_batchId_idx" ON "loans"("batchId");

-- CreateIndex
CREATE INDEX "loans_entityId_idx" ON "loans"("entityId");

-- CreateIndex
CREATE INDEX "import_jobs_userId_idx" ON "import_jobs"("userId");

-- CreateIndex
CREATE INDEX "import_jobs_entityId_idx" ON "import_jobs"("entityId");
