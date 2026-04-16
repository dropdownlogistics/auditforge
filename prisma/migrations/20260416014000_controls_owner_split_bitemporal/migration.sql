-- ============================================================================
-- Migration 2/3: CR-WB-CONTROLS-001
-- Step 3 — Owner split (dim_owner dissolution)
-- Step 4 — Bitemporal bridge fields
-- ============================================================================
-- ROLLBACK (Steps 3-4):
--   Step 3: Recreate dim_owner, repopulate from owner_role_id values,
--           re-add owner_id FK. Drop CHECK constraint.
--   Step 4: DROP COLUMN effective_date, recorded_date, previous_fact_id,
--           source, source_record_id from fact_control.
--           DROP COLUMN effective_date, recorded_date, corrects_fact_id
--           from sys_control_status_log.
-- ============================================================================

-- Steps 3a-3b already applied by phase_b_drop_owner_cleanup migration.
-- dim_owner dropped, owner_id column dropped. Skipping to 3c.

-- ────────────────────────────────────────────────────────────────────
-- STEP 3c — Add CHECK constraint for owner mutex
-- At most one of ownerRoleId or ownerEmployeeId is set.
-- Both null = unassigned (valid for existing rows).
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "fact_control"
  ADD CONSTRAINT "fact_control_owner_mutex"
  CHECK (
    NOT ("owner_role_id" IS NOT NULL AND "owner_employee_id" IS NOT NULL)
  );

-- ────────────────────────────────────────────────────────────────────
-- STEP 4a — Bitemporal fields on fact_control
-- ────────────────────────────────────────────────────────────────────

-- effectiveDate — backfill from created_at (best available proxy for
-- when the control became effective in reality).
ALTER TABLE "fact_control"
  ADD COLUMN IF NOT EXISTS "effective_date" TIMESTAMP(3);

UPDATE "fact_control"
   SET "effective_date" = "created_at"
 WHERE "effective_date" IS NULL;

ALTER TABLE "fact_control"
  ALTER COLUMN "effective_date" SET NOT NULL;

-- recordedDate — backfill from created_at (when the system knew about it).
ALTER TABLE "fact_control"
  ADD COLUMN IF NOT EXISTS "recorded_date" TIMESTAMP(3);

UPDATE "fact_control"
   SET "recorded_date" = "created_at"
 WHERE "recorded_date" IS NULL;

ALTER TABLE "fact_control"
  ALTER COLUMN "recorded_date" SET NOT NULL;

-- previousFactId — null for all existing rows (no prior version chain yet).
ALTER TABLE "fact_control"
  ADD COLUMN IF NOT EXISTS "previous_fact_id" TEXT;

-- source — existing rows tagged as "migration"; new writes use "internal".
ALTER TABLE "fact_control"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'migration';

-- sourceRecordId — idempotency key for future writes.
ALTER TABLE "fact_control"
  ADD COLUMN IF NOT EXISTS "source_record_id" TEXT;

-- ────────────────────────────────────────────────────────────────────
-- STEP 4b — Bitemporal fields on sys_control_status_log
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "sys_control_status_log"
  ADD COLUMN IF NOT EXISTS "effective_date" TIMESTAMP(3);

UPDATE "sys_control_status_log"
   SET "effective_date" = "changed_at"
 WHERE "effective_date" IS NULL;

ALTER TABLE "sys_control_status_log"
  ALTER COLUMN "effective_date" SET NOT NULL;

ALTER TABLE "sys_control_status_log"
  ADD COLUMN IF NOT EXISTS "recorded_date" TIMESTAMP(3);

UPDATE "sys_control_status_log"
   SET "recorded_date" = "changed_at"
 WHERE "recorded_date" IS NULL;

ALTER TABLE "sys_control_status_log"
  ALTER COLUMN "recorded_date" SET NOT NULL;

ALTER TABLE "sys_control_status_log"
  ADD COLUMN IF NOT EXISTS "corrects_fact_id" TEXT;
