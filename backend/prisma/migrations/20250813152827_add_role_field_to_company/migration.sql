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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("balance", "createdAt", "email", "id", "kycStatus", "name", "password", "status", "type", "updatedAt", "usdeBalance") SELECT "balance", "createdAt", "email", "id", "kycStatus", "name", "password", "status", "type", "updatedAt", "usdeBalance" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
