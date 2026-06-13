ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "filingStatus" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "leaveAnnualBalance" DECIMAL(8,2);
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "leaveSickBalance" DECIMAL(8,2);
ALTER TABLE "PayrollRun" ADD COLUMN IF NOT EXISTS "payCycle" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "PayrollRun" ADD COLUMN IF NOT EXISTS "reversedBy" TEXT;
ALTER TABLE "PayrollRun" ADD COLUMN IF NOT EXISTS "reversedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EarningsCode" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "earningsType" TEXT NOT NULL,
  "taxRule" TEXT NOT NULL DEFAULT 'TAXABLE',
  "rateMultiplier" DECIMAL(8,4),
  "glAccount" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EarningsCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeductionCode" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "deductionType" TEXT NOT NULL,
  "calculationType" TEXT NOT NULL DEFAULT 'FIXED',
  "defaultAmount" DECIMAL(18,2),
  "defaultRate" DECIMAL(8,4),
  "glAccount" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeductionCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeDeduction" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "deductionCodeId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "originalAmount" DECIMAL(18,2),
  "balance" DECIMAL(18,2),
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmployeeDeduction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EarningsCode_companyId_code_key" ON "EarningsCode"("companyId","code");
CREATE UNIQUE INDEX IF NOT EXISTS "DeductionCode_companyId_code_key" ON "DeductionCode"("companyId","code");
CREATE INDEX IF NOT EXISTS "EmployeeDeduction_companyId_employeeId_idx" ON "EmployeeDeduction"("companyId","employeeId");

ALTER TABLE "EarningsCode" DROP CONSTRAINT IF EXISTS "EarningsCode_companyId_fkey";
ALTER TABLE "EarningsCode" ADD CONSTRAINT "EarningsCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeductionCode" DROP CONSTRAINT IF EXISTS "DeductionCode_companyId_fkey";
ALTER TABLE "DeductionCode" ADD CONSTRAINT "DeductionCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeDeduction" DROP CONSTRAINT IF EXISTS "EmployeeDeduction_employeeId_fkey";
ALTER TABLE "EmployeeDeduction" ADD CONSTRAINT "EmployeeDeduction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeDeduction" DROP CONSTRAINT IF EXISTS "EmployeeDeduction_deductionCodeId_fkey";
ALTER TABLE "EmployeeDeduction" ADD CONSTRAINT "EmployeeDeduction_deductionCodeId_fkey" FOREIGN KEY ("deductionCodeId") REFERENCES "DeductionCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add SUPER_ADMIN to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
