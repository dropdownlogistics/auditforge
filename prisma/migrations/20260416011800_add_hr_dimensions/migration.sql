-- CreateEnum
CREATE TYPE "StatusParent" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "TokenPolarity" AS ENUM ('STRENGTH', 'GAP');

-- CreateEnum
CREATE TYPE "TokenLayer" AS ENUM ('UNIVERSAL', 'ROLE_SPECIFIC');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FT', 'PT', 'CONTRACTOR', 'INTERN');

-- CreateEnum
CREATE TYPE "PayCadence" AS ENUM ('HOURLY', 'WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('HIRE', 'RAISE', 'PROMOTION', 'DEMOTION', 'STRUCTURE_CHANGE', 'BONUS_ADJ', 'TERMINATION_PAY', 'CORRECTION');

-- CreateTable
CREATE TABLE "dim_role" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_department" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_employee_status" (
    "id" TEXT NOT NULL,
    "parent" "StatusParent" NOT NULL,
    "child_label" TEXT NOT NULL,
    "rehire_eligible" BOOLEAN NOT NULL DEFAULT false,
    "counts_as_headcount" BOOLEAN NOT NULL DEFAULT true,
    "accrues_pto" BOOLEAN NOT NULL DEFAULT true,
    "on_payroll" BOOLEAN NOT NULL DEFAULT true,
    "on_time_clock" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_employee_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_token" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polarity" "TokenPolarity" NOT NULL,
    "layer" "TokenLayer" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dim_role_company_id_idx" ON "dim_role"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_role_company_id_label_key" ON "dim_role"("company_id", "label");

-- CreateIndex
CREATE INDEX "dim_department_company_id_idx" ON "dim_department"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_department_company_id_name_key" ON "dim_department"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "dim_employee_status_parent_child_label_key" ON "dim_employee_status"("parent", "child_label");

-- CreateIndex
CREATE UNIQUE INDEX "dim_token_code_key" ON "dim_token"("code");

-- AddForeignKey
ALTER TABLE "dim_role" ADD CONSTRAINT "dim_role_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_department" ADD CONSTRAINT "dim_department_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
