-- ============================================================================
-- Migration 3/3: CR-WB-CONTROLS-001
-- Step 5 — Framework versioning (verify / backfill only — field already exists)
-- Step 6 — AuditTrail dual-column normalization
-- ============================================================================
-- ROLLBACK:
--   Step 5: No-op (field existed before this migration).
--   Step 6: Re-add previous_value and new_value columns to sys_audit_trail.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────
-- STEP 5 — Framework versioning
-- ────────────────────────────────────────────────────────────────────
-- frameworkVersion field already exists on dim_framework (added in a
-- prior migration). Backfill any null values with 'current'.

UPDATE "dim_framework"
   SET "framework_version" = 'current'
 WHERE "framework_version" IS NULL;

-- ────────────────────────────────────────────────────────────────────
-- STEP 6 — AuditTrail dual-column normalization
-- ────────────────────────────────────────────────────────────────────
-- CC audit §D item 4 flagged dual representations:
--   previous_value / new_value (String, singular)
--   previous_values / new_values (Json, plural)
--
-- CORRECTION: prompt said ControlStatusLog; actual table is
-- sys_audit_trail (AuditTrail model). Flagged per Rule 6.
--
-- Normalize: backfill Json plural from String singular where
-- plural is null but singular has data, then drop singular columns.

-- Backfill previous_values from previous_value where needed
UPDATE "sys_audit_trail"
   SET "previous_values" = to_jsonb("previous_value")
 WHERE "previous_values" IS NULL
   AND "previous_value" IS NOT NULL;

-- Backfill new_values from new_value where needed
UPDATE "sys_audit_trail"
   SET "new_values" = to_jsonb("new_value")
 WHERE "new_values" IS NULL
   AND "new_value" IS NOT NULL;

-- Drop singular columns
ALTER TABLE "sys_audit_trail" DROP COLUMN IF EXISTS "previous_value";
ALTER TABLE "sys_audit_trail" DROP COLUMN IF EXISTS "new_value";
