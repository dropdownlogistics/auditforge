-- Phase A Migration 3/3: payroll facts, auditor profile sibling, token assessments
-- All additive — no existing tables modified except TimeEntry and BillingRate (new columns only).

-- CreateEnum
CREATE TYPE "IndependenceType" AS ENUM ('INTERNAL', 'EXTERNAL', 'REGULATORY');

-- CreateTable: dim_auditor_profile
CREATE TABLE "dim_auditor_profile" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "independence" "IndependenceType",
    "firm" TEXT,
    "specializations" TEXT[],
    "bio" TEXT,
    "council_seat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_auditor_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fact_status_change
CREATE TABLE "fact_status_change" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_status_id" TEXT,
    "to_status_id" TEXT NOT NULL,
    "reason" TEXT,
    "authored_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_status_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fact_comp_change
CREATE TABLE "fact_comp_change" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "change_type" "ChangeType" NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prior_rate" DECIMAL(65,30),
    "new_rate" DECIMAL(65,30) NOT NULL,
    "pay_type" TEXT,
    "pay_cadence" "PayCadence",
    "reason" TEXT,
    "authored_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_comp_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fact_payroll_run
CREATE TABLE "fact_payroll_run" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "run_type" TEXT NOT NULL,
    "total_gross" DECIMAL(65,30) NOT NULL,
    "total_net" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_payroll_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fact_token_assessment
CREATE TABLE "fact_token_assessment" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL,
    "assessed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_token_assessment_pkey" PRIMARY KEY ("id")
);

-- AddColumns to fact_time_entry
ALTER TABLE "fact_time_entry" ADD COLUMN "recorded_date" TIMESTAMP(3);
ALTER TABLE "fact_time_entry" ADD COLUMN "entry_time_zone" TEXT;

-- AddColumn to dim_billing_rate
ALTER TABLE "dim_billing_rate" ADD COLUMN "role_id" TEXT;

-- CreateIndexes
CREATE UNIQUE INDEX "dim_auditor_profile_employee_id_key" ON "dim_auditor_profile"("employee_id");
CREATE INDEX "fact_status_change_employee_id_idx" ON "fact_status_change"("employee_id");
CREATE INDEX "fact_status_change_effective_date_idx" ON "fact_status_change"("effective_date");
CREATE INDEX "fact_comp_change_employee_id_idx" ON "fact_comp_change"("employee_id");
CREATE INDEX "fact_comp_change_effective_date_idx" ON "fact_comp_change"("effective_date");
CREATE INDEX "fact_payroll_run_company_id_idx" ON "fact_payroll_run"("company_id");
CREATE INDEX "fact_payroll_run_period_start_period_end_idx" ON "fact_payroll_run"("period_start", "period_end");
CREATE INDEX "fact_token_assessment_employee_id_idx" ON "fact_token_assessment"("employee_id");
CREATE INDEX "fact_token_assessment_token_id_idx" ON "fact_token_assessment"("token_id");

-- AddForeignKeys
ALTER TABLE "dim_auditor_profile" ADD CONSTRAINT "dim_auditor_profile_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "dim_employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fact_status_change" ADD CONSTRAINT "fact_status_change_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "dim_employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fact_status_change" ADD CONSTRAINT "fact_status_change_from_status_id_fkey"
  FOREIGN KEY ("from_status_id") REFERENCES "dim_employee_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_status_change" ADD CONSTRAINT "fact_status_change_to_status_id_fkey"
  FOREIGN KEY ("to_status_id") REFERENCES "dim_employee_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_comp_change" ADD CONSTRAINT "fact_comp_change_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "dim_employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fact_payroll_run" ADD CONSTRAINT "fact_payroll_run_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fact_token_assessment" ADD CONSTRAINT "fact_token_assessment_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "dim_employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fact_token_assessment" ADD CONSTRAINT "fact_token_assessment_token_id_fkey"
  FOREIGN KEY ("token_id") REFERENCES "dim_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dim_billing_rate" ADD CONSTRAINT "dim_billing_rate_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "dim_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
