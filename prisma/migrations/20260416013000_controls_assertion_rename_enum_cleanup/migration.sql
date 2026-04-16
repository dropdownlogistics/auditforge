-- ============================================================================
-- Migration 1/3: CR-WB-CONTROLS-001
-- Step 1 — Assertion → ControlObjective rename + new seed rows
-- Step 2 — Legacy controlType enum cleanup
-- ============================================================================
-- ROLLBACK: Reverse each ALTER TABLE RENAME. Re-add dropped columns.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────
-- STEP 1a — Rename dim_assertion → dim_control_objective
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "dim_assertion" RENAME TO "dim_control_objective";
ALTER TABLE "dim_control_objective" RENAME COLUMN "assertion_name" TO "objective_name";

-- Drop + recreate the unique constraint under the new name
ALTER TABLE "dim_control_objective" DROP CONSTRAINT IF EXISTS "dim_assertion_assertion_name_key";
ALTER TABLE "dim_control_objective" ADD CONSTRAINT "dim_control_objective_objective_name_key" UNIQUE ("objective_name");

-- ────────────────────────────────────────────────────────────────────
-- STEP 1b — Add objectiveCategory field
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "dim_control_objective"
  ADD COLUMN IF NOT EXISTS "objective_category" TEXT NOT NULL DEFAULT 'financial-audit';

-- Backfill: all existing rows (the 9 PCAOB/COSO assertions) get 'financial-audit'
UPDATE "dim_control_objective"
   SET "objective_category" = 'financial-audit'
 WHERE "objective_category" = 'financial-audit'; -- no-op for default; safety net

-- ────────────────────────────────────────────────────────────────────
-- STEP 1c — Add new enum value for non-audit objective categories
-- ────────────────────────────────────────────────────────────────────

-- Extend AssertionCategory enum to include GENERAL for non-audit objectives
ALTER TYPE "AssertionCategory" ADD VALUE IF NOT EXISTS 'GENERAL';

-- NOTE: GENERAL seed rows deferred to separate migration (PostgreSQL requires
-- new enum values to be committed before use in INSERT/UPDATE).

-- ────────────────────────────────────────────────────────────────────
-- STEP 1e — Rename bridge table + FK column
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "bridge_control_assertion" RENAME COLUMN "assertion_id" TO "control_objective_id";
ALTER TABLE "bridge_control_assertion" RENAME TO "bridge_control_objective";

-- Rename the composite PK constraint
ALTER TABLE "bridge_control_objective"
  DROP CONSTRAINT IF EXISTS "bridge_control_assertion_pkey";
ALTER TABLE "bridge_control_objective"
  ADD CONSTRAINT "bridge_control_objective_pkey"
  PRIMARY KEY ("control_id", "control_objective_id");

-- Rename FK constraints
ALTER TABLE "bridge_control_objective"
  DROP CONSTRAINT IF EXISTS "bridge_control_assertion_assertion_id_fkey";
ALTER TABLE "bridge_control_objective"
  ADD CONSTRAINT "bridge_control_objective_control_objective_id_fkey"
  FOREIGN KEY ("control_objective_id") REFERENCES "dim_control_objective"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bridge_control_objective"
  DROP CONSTRAINT IF EXISTS "bridge_control_assertion_control_id_fkey";
ALTER TABLE "bridge_control_objective"
  ADD CONSTRAINT "bridge_control_objective_control_id_fkey"
  FOREIGN KEY ("control_id") REFERENCES "fact_control"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────
-- STEP 2a — Verify controlTypeDimId is populated for all controls
-- (Backfill from legacy enum if any nulls exist)
-- ────────────────────────────────────────────────────────────────────

-- Map legacy controlType + controlNature → dim_control_type row
-- This handles any controls that have the legacy enum set but no dim FK.
UPDATE "fact_control" fc
   SET "control_type_dim_id" = ct."id"
  FROM "dim_control_type" ct
 WHERE fc."control_type_dim_id" IS NULL
   AND ct."nature"::text = fc."control_type"::text
   AND ct."automation"::text = CASE fc."control_nature"::text
     WHEN 'IT_DEPENDENT_MANUAL' THEN 'IT_DEPENDENT'
     ELSE fc."control_nature"::text
   END
   AND ct."domain" = 'BUSINESS'; -- default domain for legacy backfill

-- ────────────────────────────────────────────────────────────────────
-- STEP 2b — Drop legacy controlType enum column
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "fact_control" DROP COLUMN IF EXISTS "control_type";

-- ────────────────────────────────────────────────────────────────────
-- STEP 2c — Rename controlTypeDimId → controlTypeId
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "fact_control" RENAME COLUMN "control_type_dim_id" TO "control_type_id";

-- Update index
DROP INDEX IF EXISTS "fact_control_control_type_dim_id_idx";
CREATE INDEX "fact_control_control_type_id_idx" ON "fact_control" ("control_type_id");

-- ────────────────────────────────────────────────────────────────────
-- STEP 2d — Drop the legacy ControlType enum type (if no longer referenced)
-- ────────────────────────────────────────────────────────────────────

-- NOTE: Only safe if no other column uses ControlType enum.
-- The enum values are preserved in dim_control_type.nature (ControlTypeNature).
DROP TYPE IF EXISTS "ControlType";
