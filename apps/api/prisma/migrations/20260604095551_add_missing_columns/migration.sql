/*
  Warnings:

  - Added the required column `updatedAt` to the `PayrollItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('Expert', 'Citizen', 'Contract');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('TZS', 'USD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'LOCK';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PAYROLL_PROCESSOR';
ALTER TYPE "Role" ADD VALUE 'VIEWER';

-- DropIndex
DROP INDEX "Employee_companyId_employeeNumber_key";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contract" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "nssfReg" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxYear" TEXT NOT NULL DEFAULT '2025/26',
ADD COLUMN     "wcfReg" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'Citizen',
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'TZS',
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "housingAllowance" DECIMAL(18,2),
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "siteAllowance" DECIMAL(18,2),
ADD COLUMN     "stdHoursPerMonth" DECIMAL(10,2),
ADD COLUMN     "title" TEXT,
ADD COLUMN     "transportAllowance" DECIMAL(18,2),
ADD COLUMN     "usdSalary" DECIMAL(18,2);

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payRate" DECIMAL(5,2) NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "PayrollItem" ADD COLUMN     "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "adjustments" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "basicPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherAdditions" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "phHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "phPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalEmployerCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PayrollRun" ADD COLUMN     "exchangeRate" DECIMAL(18,6),
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "standardHoursPerDay" DECIMAL(8,2) NOT NULL DEFAULT 9,
ADD COLUMN     "workingDays" INTEGER NOT NULL DEFAULT 26;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "SalaryHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "payType" "EmploymentType" NOT NULL,
    "fixedSalaryTzs" DECIMAL(18,2),
    "hourlyRateTzs" DECIMAL(18,2),
    "stdHoursPerMonth" DECIMAL(10,2),
    "currency" "Currency" NOT NULL,
    "usdSalary" DECIMAL(18,2),
    "exchangeRate" DECIMAL(18,6),
    "housingAllowance" DECIMAL(18,2),
    "transportAllow" DECIMAL(18,2),
    "siteAllowance" DECIMAL(18,2),
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLineSnapshot" (
    "id" TEXT NOT NULL,
    "payrollLineId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,

    CONSTRAINT "PayrollLineSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowsMatched" INTEGER NOT NULL,
    "rowsSkipped" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "TimesheetImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryHistory_companyId_employeeId_effectiveDate_idx" ON "SalaryHistory"("companyId", "employeeId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollLineSnapshot_payrollLineId_key" ON "PayrollLineSnapshot"("payrollLineId");

-- CreateIndex
CREATE INDEX "TimesheetImport_companyId_payrollRunId_idx" ON "TimesheetImport"("companyId", "payrollRunId");

-- CreateIndex
CREATE INDEX "Employee_companyId_employeeNumber_idx" ON "Employee"("companyId", "employeeNumber");

-- CreateIndex
CREATE INDEX "Employee_companyId_employmentType_contractType_idx" ON "Employee"("companyId", "employmentType", "contractType");

-- AddForeignKey
ALTER TABLE "SalaryHistory" ADD CONSTRAINT "SalaryHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryHistory" ADD CONSTRAINT "SalaryHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLineSnapshot" ADD CONSTRAINT "PayrollLineSnapshot_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "PayrollItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetImport" ADD CONSTRAINT "TimesheetImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetImport" ADD CONSTRAINT "TimesheetImport_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
