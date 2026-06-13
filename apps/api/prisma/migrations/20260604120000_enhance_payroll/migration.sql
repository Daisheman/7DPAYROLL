-- Enhance payroll schema: multi-country, OT types, deductions toggle, YTD

-- Company enhancements
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "baseCurrency"     TEXT NOT NULL DEFAULT 'TZS';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "taxCurrency"      TEXT NOT NULL DEFAULT 'TZS';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "workingDays"      INTEGER NOT NULL DEFAULT 26;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "stdHoursPerDay"   INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "deductionsActive" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl"          TEXT;

-- Employee enhancements
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "department"        TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "standbyDailyRate"  DECIMAL(18,2);

-- Fix currency column type (was enum, now text)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Employee' AND column_name = 'currency'
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "Employee" ALTER COLUMN "currency" TYPE TEXT USING "currency"::text;
  END IF;
END $$;

ALTER TABLE "Employee" ALTER COLUMN "currency" SET DEFAULT 'TZS';

-- SalaryHistory: currency as text
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SalaryHistory' AND column_name = 'currency'
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "SalaryHistory" ALTER COLUMN "currency" TYPE TEXT USING "currency"::text;
  END IF;
END $$;

ALTER TABLE "SalaryHistory" ALTER COLUMN "currency" SET DEFAULT 'TZS';
ALTER TABLE "SalaryHistory" ADD COLUMN IF NOT EXISTS "standbyDailyRate" DECIMAL(18,2);

-- PayrollRun enhancements
ALTER TABLE "PayrollRun" ADD COLUMN IF NOT EXISTS "deductionsActive" BOOLEAN NOT NULL DEFAULT TRUE;

-- PayrollItem: new variable pay columns
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "ot20Hours"      DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "ot20Pay"        DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "standbyDays"    DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "standbyPay"     DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "callout15Hours" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "callout15Pay"   DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "callout20Hours" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "callout20Pay"   DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "bonus"          DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "levy"           DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "ytdNssf"        DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "ytdNet"         DECIMAL(18,2) NOT NULL DEFAULT 0;

-- LeaveRequest: add companyId FK and new fields
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "companyId"   TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "approvedBy"  TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN IF NOT EXISTS "approvedAt"  TIMESTAMP;

-- Populate companyId from employee if missing
UPDATE "LeaveRequest" lr
SET "companyId" = e."companyId"
FROM "Employee" e
WHERE lr."employeeId" = e.id
  AND lr."companyId" IS NULL;

-- Drop the old Currency enum if it exists and is no longer used
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Currency') THEN
    -- Only drop if no columns use it anymore
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE udt_name = 'Currency'
    ) THEN
      DROP TYPE "Currency";
    END IF;
  END IF;
END $$;
