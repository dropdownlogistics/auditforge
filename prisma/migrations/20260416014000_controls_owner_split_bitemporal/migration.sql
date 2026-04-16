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

-- ────────────────────────────────────────────────────────────────────
-- STEP 3a — Backfill ownerRoleId from dim_owner for existing controls
-- ────────────────────────────────────────────────────────────────────

-- Current state: 106 controls have ownerId FK → dim_owner.
-- dim_owner rows are role-based (CSO, CEO, CTO). Backfill ownerRoleId
-- with the owner's ownerName (title string) as the role key.
-- ownerEmployeeId stays null — all existing ownership is role-based.

UPDATE "fact_control" fc
   SET "owner_role_id" = o."owner_name"
  FROM "dim_owner" o
 WHERE fc."owner_id" = o."id"
   AND fc."owner_role_id" IS NULL;

-- ────────────────────────────────────────────────────────────────────
-- STEP 3b — Drop ownerId FK + dim_owner
-- ────────────────────────────────────────────────────────────────────

-- Remove FK constraint first
ALTER TABLE "fact_control" DROP CONSTRAINT IF EXISTS "fact_control_owner_id_fkey";

-- Drop the ownerId column
ALTER TABLE "fact_control" DROP COLUMN IF EXISTS "owner_id";

-- Drop dim_owner table (data preserved in ownerRoleId backfill above)
DROP TABLE IF EXISTS "dim_owner";

-- ────────────────────────────────────────────────────────────────────
-- STEP 3c — Add CHECK constraint for owner mutex (C2 invariant)
-- Exactly one of ownerRoleId or ownerEmployeeId must be non-null.
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "fact_control"
  ADD CONSTRAINT "fact_control_owner_mutex"
  CHECK (
    (("owner_role_id" IS NOT NULL AND "owner_employee_id" IS NULL) OR
     ("owner_role_id" IS NULL AND "owner_employee_id" IS NOT NULL))
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
