-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'EXTERNAL', 'REGULATORY');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PLANNING', 'FIELDWORK', 'REPORTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScopeDecision" AS ENUM ('IN_SCOPE', 'OUT_OF_SCOPE', 'DEFERRED');

-- AlterEnum
ALTER TYPE "TemplateType" ADD VALUE 'AUDIT_PLAN';

-- AlterTable
ALTER TABLE "sys_audit_trail" ADD COLUMN     "new_values" JSONB,
ADD COLUMN     "previous_values" JSONB;

-- CreateTable
CREATE TABLE "dim_auditor" (
    "id" TEXT NOT NULL,
    "auditor_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "auditor_name" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "email" TEXT,
    "certifications" TEXT,
    "independence" TEXT NOT NULL DEFAULT 'INTERNAL',
    "firm" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_auditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_audit" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "audit_name" TEXT NOT NULL,
    "audit_type" "AuditType" NOT NULL DEFAULT 'INTERNAL',
    "status" "AuditStatus" NOT NULL DEFAULT 'PLANNING',
    "lead_auditor_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "report_date" TIMESTAMP(3),
    "scope" TEXT,
    "methodology" TEXT,
    "cancel_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_audit_control" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "in_scope" BOOLEAN NOT NULL DEFAULT true,
    "scope_decision" "ScopeDecision" NOT NULL DEFAULT 'IN_SCOPE',
    "scope_rationale" TEXT,
    "assigned_to_id" TEXT,
    "target_date" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_audit_control_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_auditor_auditor_id_key" ON "dim_auditor"("auditor_id");

-- CreateIndex
CREATE INDEX "dim_auditor_company_id_idx" ON "dim_auditor"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_audit_audit_id_key" ON "fact_audit"("audit_id");

-- CreateIndex
CREATE INDEX "fact_audit_company_id_idx" ON "fact_audit"("company_id");

-- CreateIndex
CREATE INDEX "fact_audit_period_id_idx" ON "fact_audit"("period_id");

-- CreateIndex
CREATE INDEX "fact_audit_status_idx" ON "fact_audit"("status");

-- CreateIndex
CREATE INDEX "bridge_audit_control_audit_id_idx" ON "bridge_audit_control"("audit_id");

-- CreateIndex
CREATE INDEX "bridge_audit_control_control_id_idx" ON "bridge_audit_control"("control_id");

-- CreateIndex
CREATE UNIQUE INDEX "bridge_audit_control_audit_id_control_id_valid_from_key" ON "bridge_audit_control"("audit_id", "control_id", "valid_from");

-- AddForeignKey
ALTER TABLE "dim_auditor" ADD CONSTRAINT "dim_auditor_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_audit" ADD CONSTRAINT "fact_audit_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_audit" ADD CONSTRAINT "fact_audit_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "dim_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_audit" ADD CONSTRAINT "fact_audit_lead_auditor_id_fkey" FOREIGN KEY ("lead_auditor_id") REFERENCES "dim_auditor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_audit_control" ADD CONSTRAINT "bridge_audit_control_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "fact_audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_audit_control" ADD CONSTRAINT "bridge_audit_control_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_audit_control" ADD CONSTRAINT "bridge_audit_control_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "dim_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
