/*
  Warnings:

  - You are about to drop the `accu_batches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "accu_batches_status_idx";

-- DropIndex
DROP INDEX "accu_batches_entityId_idx";

-- DropIndex
DROP INDEX "accu_batches_batchNumber_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "accu_batches";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "accus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "issuanceDate" DATETIME NOT NULL,
    "serialRangeStart" TEXT NOT NULL,
    "serialRangeEnd" TEXT NOT NULL,
    "category" TEXT NOT NULL,
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
    CONSTRAINT "accus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accus_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "method" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_log_entries" (
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
    CONSTRAINT "audit_log_entries_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "accus" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_audit_log_entries" ("action", "entityId", "id", "ipAddress", "newValues", "oldValues", "recordId", "tableName", "timestamp", "userId") SELECT "action", "entityId", "id", "ipAddress", "newValues", "oldValues", "recordId", "tableName", "timestamp", "userId" FROM "audit_log_entries";
DROP TABLE "audit_log_entries";
ALTER TABLE "new_audit_log_entries" RENAME TO "audit_log_entries";
CREATE INDEX "audit_log_entries_userId_idx" ON "audit_log_entries"("userId");
CREATE INDEX "audit_log_entries_timestamp_idx" ON "audit_log_entries"("timestamp");
CREATE TABLE "new_loans" (
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
    CONSTRAINT "loans_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loans_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "creditors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "loans_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_loans" ("batchId", "buybackDate", "buybackRate", "collateralValue", "createdAt", "creditorId", "entityId", "id", "loanAmount", "loanStatus", "quantity", "updatedAt") SELECT "batchId", "buybackDate", "buybackRate", "collateralValue", "createdAt", "creditorId", "entityId", "id", "loanAmount", "loanStatus", "quantity", "updatedAt" FROM "loans";
DROP TABLE "loans";
ALTER TABLE "new_loans" RENAME TO "loans";
CREATE INDEX "loans_batchId_idx" ON "loans"("batchId");
CREATE INDEX "loans_entityId_idx" ON "loans"("entityId");
CREATE TABLE "new_reclassification_requests" (
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
    CONSTRAINT "reclassification_requests_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reclassification_requests_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_reclassification_requests" ("approvedAt", "approvedBy", "batchId", "entityId", "fromClass", "id", "reason", "status", "submittedBy", "timestamp", "toClass") SELECT "approvedAt", "approvedBy", "batchId", "entityId", "fromClass", "id", "reason", "status", "submittedBy", "timestamp", "toClass" FROM "reclassification_requests";
DROP TABLE "reclassification_requests";
ALTER TABLE "new_reclassification_requests" RENAME TO "reclassification_requests";
CREATE INDEX "reclassification_requests_batchId_idx" ON "reclassification_requests"("batchId");
CREATE INDEX "reclassification_requests_status_idx" ON "reclassification_requests"("status");
CREATE TABLE "new_valuation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "marketPrice" REAL NOT NULL,
    "nrv" REAL NOT NULL,
    "impairment" REAL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "valuation_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "accus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "valuation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_valuation_logs" ("batchId", "createdAt", "date", "entityId", "id", "impairment", "marketPrice", "nrv", "userId") SELECT "batchId", "createdAt", "date", "entityId", "id", "impairment", "marketPrice", "nrv", "userId" FROM "valuation_logs";
DROP TABLE "valuation_logs";
ALTER TABLE "new_valuation_logs" RENAME TO "valuation_logs";
CREATE INDEX "valuation_logs_batchId_idx" ON "valuation_logs"("batchId");
CREATE INDEX "valuation_logs_date_idx" ON "valuation_logs"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "accus_entityId_idx" ON "accus"("entityId");

-- CreateIndex
CREATE INDEX "accus_status_idx" ON "accus"("status");
