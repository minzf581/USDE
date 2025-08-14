-- CreateTable
CREATE TABLE "USDETransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference_id" TEXT,
    "reference_type" TEXT,
    "balanceBefore" REAL,
    "balanceAfter" REAL,
    "description" TEXT,
    "blockchainTxHash" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "USDETransaction_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'company',
    "role" TEXT NOT NULL DEFAULT 'enterprise_user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "balance" REAL NOT NULL DEFAULT 0,
    "usdeBalance" REAL NOT NULL DEFAULT 0,
    "parentCompanyId" TEXT,
    "companyType" TEXT,
    "isEnterprise" BOOLEAN NOT NULL DEFAULT false,
    "isEnterpriseAdmin" BOOLEAN NOT NULL DEFAULT false,
    "companyCode" TEXT,
    "companyAddress" TEXT,
    "ucBalance" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_parentCompanyId_fkey" FOREIGN KEY ("parentCompanyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("balance", "createdAt", "email", "id", "kycStatus", "name", "password", "role", "status", "type", "updatedAt", "usdeBalance") SELECT "balance", "createdAt", "email", "id", "kycStatus", "name", "password", "role", "status", "type", "updatedAt", "usdeBalance" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
