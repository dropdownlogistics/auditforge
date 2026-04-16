-- Phase A Migration 2/3: rename dim_auditor → dim_employee, extend with HR fields
-- MANUAL MIGRATION — Prisma would generate DROP+CREATE; we use ALTER TABLE RENAME
-- to preserve 47 existing rows and all FK references.

-- ============================================================
-- STEP 1: Drop FK constraints referencing dim_auditor
-- (will be recreated pointing at dim_employee)
-- ============================================================

ALTER TABLE "bridge_audit_auditor" DROP CONSTRAINT "bridge_audit_auditor_auditor_id_fkey";
ALTER TABLE "bridge_audit_control" DROP CONSTRAINT "bridge_audit_control_assigned_to_id_fkey";
ALTER TABLE "fact_audit" DROP CONSTRAINT "fact_audit_lead_auditor_id_fkey";
ALTER TABLE "fact_time_entry" DROP CONSTRAINT "fact_time_entry_auditorId_fkey";
ALTER TABLE "dim_auditor" DROP CONSTRAINT "dim_auditor_company_id_fkey";

-- ============================================================
-- STEP 2: Rename table
-- ============================================================

ALTER TABLE "dim_auditor" RENAME TO "dim_employee";

-- Rename PK and unique constraints/indexes to match new table name
ALTER INDEX "dim_auditor_pkey" RENAME TO "dim_employee_pkey";
ALTER INDEX "dim_auditor_auditor_id_key" RENAME TO "dim_employee_auditor_id_key";
ALTER INDEX "dim_auditor_company_id_idx" RENAME TO "dim_employee_company_id_idx";

-- ============================================================
-- STEP 3: Add HR columns (all nullable for safe migration)
-- ============================================================

ALTER TABLE "dim_employee" ADD COLUMN "first_name" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "last_name" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "preferred_name" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "manager_id" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "role_id" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "department_id" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "status_id" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "employment_type" "EmploymentType";
ALTER TABLE "dim_employee" ADD COLUMN "employee_time_zone" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE "dim_employee" ADD COLUMN "external_id" TEXT;
ALTER TABLE "dim_employee" ADD COLUMN "external_metadata" JSONB;

-- ============================================================
-- STEP 4: Recreate FK constraints pointing at dim_employee
-- ============================================================

ALTER TABLE "dim_employee" ADD CONSTRAINT "dim_employee_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dim_employee" ADD CONSTRAINT "dim_employee_manager_id_fkey"
  FOREIGN KEY ("manager_id") REFERENCES "dim_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dim_employee" ADD CONSTRAINT "dim_employee_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "dim_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dim_employee" ADD CONSTRAINT "dim_employee_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "dim_department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dim_employee" ADD CONSTRAINT "dim_employee_status_id_fkey"
  FOREIGN KEY ("status_id") REFERENCES "dim_employee_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bridge_audit_auditor" ADD CONSTRAINT "bridge_audit_auditor_auditor_id_fkey"
  FOREIGN KEY ("auditor_id") REFERENCES "dim_employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bridge_audit_control" ADD CONSTRAINT "bridge_audit_control_assigned_to_id_fkey"
  FOREIGN KEY ("assigned_to_id") REFERENCES "dim_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_audit" ADD CONSTRAINT "fact_audit_lead_auditor_id_fkey"
  FOREIGN KEY ("lead_auditor_id") REFERENCES "dim_employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_time_entry" ADD CONSTRAINT "fact_time_entry_auditorId_fkey"
  FOREIGN KEY ("auditorId") REFERENCES "dim_employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- STEP 5: Sibling Mandate fix — User gets employeeId FK
-- ============================================================

ALTER TABLE "dim_user" ADD COLUMN "employee_id" TEXT;

ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "dim_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- STEP 6: Sibling Mandate fix — Control gets owner FKs
-- ============================================================

ALTER TABLE "fact_control" ADD COLUMN "owner_employee_id" TEXT;
ALTER TABLE "fact_control" ADD COLUMN "owner_role_id" TEXT;

ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_owner_employee_id_fkey"
  FOREIGN KEY ("owner_employee_id") REFERENCES "dim_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_control" ADD CONSTRAINT "fact_control_owner_role_id_fkey"
  FOREIGN KEY ("owner_role_id") REFERENCES "dim_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
