-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "PublicPrivate" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'STRATEGIC', 'TECHNOLOGY');

-- CreateEnum
CREATE TYPE "RiskRating" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ControlType" AS ENUM ('PREVENTIVE', 'DETECTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "ControlNature" AS ENUM ('MANUAL', 'AUTOMATED', 'IT_DEPENDENT_MANUAL');

-- CreateEnum
CREATE TYPE "ControlTypeNature" AS ENUM ('PREVENTIVE', 'DETECTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "ControlAutomation" AS ENUM ('MANUAL', 'AUTOMATED', 'IT_DEPENDENT');

-- CreateEnum
CREATE TYPE "ControlDomain" AS ENUM ('BUSINESS', 'IT', 'HYBRID');

-- CreateEnum
CREATE TYPE "ControlFrequency" AS ENUM ('REAL_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'AD_HOC');

-- CreateEnum
CREATE TYPE "EffectivenessStatus" AS ENUM ('EFFECTIVE', 'INEFFECTIVE', 'NOT_TESTED', 'PARTIALLY_EFFECTIVE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PREPARED', 'REVIEWED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ControlLifecycle" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ENTITY', 'BUSINESS_UNIT', 'LOCATION');

-- CreateEnum
CREATE TYPE "AssertionCategory" AS ENUM ('TRANSACTION', 'BALANCE', 'DISCLOSURE');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('RCM', 'MCL', 'WALKTHROUGH', 'RISK_ASSESSMENT', 'FRAMEWORK_MAP', 'GAP_ANALYSIS', 'CONTROL_DESCRIPTION', 'TESTING_PLAN');

-- CreateEnum
CREATE TYPE "OutputFormat" AS ENUM ('DOCX', 'XLSX', 'PDF');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('ANNUAL', 'QUARTERLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "dim_company" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" "CompanySize" NOT NULL DEFAULT 'MEDIUM',
    "public_private" "PublicPrivate" NOT NULL DEFAULT 'PRIVATE',
    "fiscal_year_end" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_process" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "process_area" TEXT NOT NULL,
    "process_name" TEXT NOT NULL,
    "subprocess_name" TEXT,
    "process_owner" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_risk" (
    "id" TEXT NOT NULL,
    "risk_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RiskCategory" NOT NULL DEFAULT 'OPERATIONAL',
    "likelihood" "RiskRating" NOT NULL DEFAULT 'MEDIUM',
    "impact" "RiskRating" NOT NULL DEFAULT 'MEDIUM',
    "inherent_risk_rating" "RiskRating" NOT NULL DEFAULT 'MEDIUM',
    "residual_risk_rating" "RiskRating",
    "risk_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dim_risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_framework" (
    "id" TEXT NOT NULL,
    "framework_name" TEXT NOT NULL,
    "framework_version" TEXT,
    "domain" TEXT,
    "requirement_id" TEXT NOT NULL,
    "requirement_description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_period" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "period_type" "PeriodType" NOT NULL DEFAULT 'ANNUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_assertion" (
    "id" TEXT NOT NULL,
    "assertion_name" TEXT NOT NULL,
    "category" "AssertionCategory" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "dim_assertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_owner" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_scope" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "entity" TEXT NOT NULL,
    "business_unit" TEXT,
    "location" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_control_type" (
    "id" TEXT NOT NULL,
    "nature" "ControlTypeNature" NOT NULL,
    "automation" "ControlAutomation" NOT NULL,
    "domain" "ControlDomain" NOT NULL DEFAULT 'BUSINESS',
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_control_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_control" (
    "id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "scope_id" TEXT,
    "control_type_dim_id" TEXT,
    "control_description" TEXT NOT NULL,
    "control_objective" TEXT,
    "control_type" "ControlType" NOT NULL DEFAULT 'PREVENTIVE',
    "control_nature" "ControlNature" NOT NULL DEFAULT 'MANUAL',
    "control_frequency" "ControlFrequency" NOT NULL DEFAULT 'MONTHLY',
    "key_control" BOOLEAN NOT NULL DEFAULT false,
    "design_effectiveness" "EffectivenessStatus" NOT NULL DEFAULT 'NOT_TESTED',
    "operating_effectiveness" "EffectivenessStatus" NOT NULL DEFAULT 'NOT_TESTED',
    "lifecycle_status" "ControlLifecycle" NOT NULL DEFAULT 'DRAFT',
    "superseded_by_id" TEXT,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "change_reason" TEXT,
    "evidence_description" TEXT,
    "test_procedure" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fact_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_control_risk" (
    "control_id" TEXT NOT NULL,
    "risk_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "bridge_control_risk_pkey" PRIMARY KEY ("control_id","risk_id")
);

-- CreateTable
CREATE TABLE "bridge_control_framework" (
    "control_id" TEXT NOT NULL,
    "framework_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "bridge_control_framework_pkey" PRIMARY KEY ("control_id","framework_id")
);

-- CreateTable
CREATE TABLE "bridge_control_assertion" (
    "control_id" TEXT NOT NULL,
    "assertion_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "bridge_control_assertion_pkey" PRIMARY KEY ("control_id","assertion_id")
);

-- CreateTable
CREATE TABLE "sys_control_status_log" (
    "id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "status_type" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "sys_control_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_audit_trail" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "previous_value" TEXT,
    "new_value" TEXT,
    "user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rationale" TEXT,

    CONSTRAINT "sys_audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_template" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template_type" "TemplateType" NOT NULL,
    "description" TEXT,
    "output_format" "OutputFormat" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "definition" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_generated_document" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_format" "OutputFormat" NOT NULL,
    "template_version" TEXT NOT NULL,
    "template_snapshot" JSONB,
    "draft_version" INTEGER NOT NULL DEFAULT 1,
    "doc_status" "DocStatus" NOT NULL DEFAULT 'DRAFT',
    "data_hash" TEXT,
    "frozen_at" TIMESTAMP(3),
    "generated_by" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_path" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sys_generated_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_company_company_id_key" ON "dim_company"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_process_company_id_process_id_key" ON "dim_process"("company_id", "process_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_risk_company_id_risk_id_key" ON "dim_risk"("company_id", "risk_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_framework_framework_name_requirement_id_key" ON "dim_framework"("framework_name", "requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "dim_period_company_id_period_label_key" ON "dim_period"("company_id", "period_label");

-- CreateIndex
CREATE UNIQUE INDEX "dim_assertion_assertion_name_key" ON "dim_assertion"("assertion_name");

-- CreateIndex
CREATE UNIQUE INDEX "dim_owner_company_id_owner_name_key" ON "dim_owner"("company_id", "owner_name");

-- CreateIndex
CREATE UNIQUE INDEX "dim_scope_company_id_entity_business_unit_location_key" ON "dim_scope"("company_id", "entity", "business_unit", "location");

-- CreateIndex
CREATE UNIQUE INDEX "dim_control_type_label_key" ON "dim_control_type"("label");

-- CreateIndex
CREATE UNIQUE INDEX "dim_control_type_nature_automation_domain_key" ON "dim_control_type"("nature", "automation", "domain");

-- CreateIndex
CREATE INDEX "fact_control_company_id_idx" ON "fact_control"("company_id");

-- CreateIndex
CREATE INDEX "fact_control_process_id_idx" ON "fact_control"("process_id");

-- CreateIndex
CREATE INDEX "fact_control_review_status_idx" ON "fact_control"("review_status");

-- CreateIndex
CREATE INDEX "fact_control_lifecycle_status_idx" ON "fact_control"("lifecycle_status");

-- CreateIndex
CREATE INDEX "fact_control_control_type_dim_id_idx" ON "fact_control"("control_type_dim_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_control_company_id_control_id_period_id_version_key" ON "fact_control"("company_id", "control_id", "period_id", "version");

-- CreateIndex
CREATE INDEX "bridge_control_risk_valid_to_idx" ON "bridge_control_risk"("valid_to");

-- CreateIndex
CREATE INDEX "bridge_control_framework_valid_to_idx" ON "bridge_control_framework"("valid_to");

-- CreateIndex
CREATE INDEX "bridge_control_assertion_valid_to_idx" ON "bridge_control_assertion"("valid_to");

-- CreateIndex
CREATE INDEX "sys_control_status_log_control_id_idx" ON "sys_control_status_log"("control_id");

-- CreateIndex
CREATE INDEX "sys_control_status_log_changed_at_idx" ON "sys_control_status_log"("changed_at");

-- CreateIndex
CREATE INDEX "sys_audit_trail_entity_type_entity_id_idx" ON "sys_audit_trail"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "sys_audit_trail_user_id_idx" ON "sys_audit_trail"("user_id");

-- CreateIndex
CREATE INDEX "sys_audit_trail_timestamp_idx" ON "sys_audit_trail"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "sys_template_template_id_key" ON "sys_template"("template_id");

-- CreateIndex
CREATE INDEX "sys_generated_document_company_id_period_label_idx" ON "sys_generated_document"("company_id", "period_label");

-- CreateIndex
CREATE INDEX "sys_generated_document_doc_status_idx" ON "sys_generated_document"("doc_status");

-- AddForeignKey
ALTER TABLE "dim_process" ADD CONSTRAINT "dim_process_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_risk" ADD CONSTRAINT "dim_risk_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_period" ADD CONSTRAINT "dim_period_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_owner" ADD CONSTRAINT "dim_owner_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_scope" ADD CONSTRAINT "dim_scope_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "dim_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "dim_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "dim_owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_scope_id_fkey" FOREIGN KEY ("scope_id") REFERENCES "dim_scope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_control_type_dim_id_fkey" FOREIGN KEY ("control_type_dim_id") REFERENCES "dim_control_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "fact_control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_risk" ADD CONSTRAINT "bridge_control_risk_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_risk" ADD CONSTRAINT "bridge_control_risk_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "dim_risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_framework" ADD CONSTRAINT "bridge_control_framework_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_framework" ADD CONSTRAINT "bridge_control_framework_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "dim_framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_assertion" ADD CONSTRAINT "bridge_control_assertion_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_control_assertion" ADD CONSTRAINT "bridge_control_assertion_assertion_id_fkey" FOREIGN KEY ("assertion_id") REFERENCES "dim_assertion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_control_status_log" ADD CONSTRAINT "sys_control_status_log_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_generated_document" ADD CONSTRAINT "sys_generated_document_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "sys_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
