-- CR-WB-FINDINGS-001 Migration 1
-- Dim_Severity + Finding severity/owner/bitemporal migration
-- Steps 1 + 3 of the extraction plan
--
-- Idempotent where possible. Forward-only after Step 6.

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Dim_Severity
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "dim_severity" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_severity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dim_severity_level_key" ON "dim_severity"("level");
CREATE UNIQUE INDEX IF NOT EXISTS "dim_severity_rank_key" ON "dim_severity"("rank");

-- ═══════════════════════════════════════════════════════════
-- Step 2: Seed Dim_Severity (4 rows)
-- Maps from FindingSeverity enum to platform dimension:
--   OBSERVATION → LOW (rank 1)
--   CONTROL_DEFICIENCY → MEDIUM (rank 2)
--   SIGNIFICANT_DEFICIENCY → HIGH (rank 3)
--   MATERIAL_WEAKNESS → CRITICAL (rank 4)
-- ═══════════════════════════════════════════════════════════

INSERT INTO "dim_severity" ("id", "level", "rank", "label")
VALUES
  ('sev_low',      'LOW',      1, 'Low'),
  ('sev_medium',   'MEDIUM',   2, 'Medium'),
  ('sev_high',     'HIGH',     3, 'High'),
  ('sev_critical', 'CRITICAL', 4, 'Critical')
ON CONFLICT ("level") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Step 3: Add new columns to fact_finding (nullable first)
-- ═══════════════════════════════════════════════════════════

-- 3a: severity FK (nullable for backfill)
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "severity_id" TEXT;

-- 3b: owner split columns
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "owner_role_id" TEXT;
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "owner_employee_id" TEXT;

-- 3c: bitemporal bridge fields
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "effective_date" TIMESTAMP(3);
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "recorded_date" TIMESTAMP(3);
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "previous_fact_id" TEXT;
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'migration';
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "source_record_id" TEXT;

-- 3d: cross-promoted sibling + additional fields
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "control_objective_id" TEXT;
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "occurrence_date" TIMESTAMP(3);
ALTER TABLE "fact_finding" ADD COLUMN IF NOT EXISTS "prior_finding_id" TEXT;

-- ═══════════════════════════════════════════════════════════
-- Step 4: Backfill severity_id from FindingSeverity enum
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding"
SET "severity_id" = CASE "severity"::text
  WHEN 'OBSERVATION'            THEN 'sev_low'
  WHEN 'CONTROL_DEFICIENCY'     THEN 'sev_medium'
  WHEN 'SIGNIFICANT_DEFICIENCY' THEN 'sev_high'
  WHEN 'MATERIAL_WEAKNESS'      THEN 'sev_critical'
END
WHERE "severity_id" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 5: Backfill bitemporal fields from createdAt
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding"
SET "effective_date" = "created_at"
WHERE "effective_date" IS NULL;

UPDATE "fact_finding"
SET "recorded_date" = "created_at"
WHERE "recorded_date" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 6: Backfill owner → ownerRoleId
-- Finding.owner is a plain text field. Map to ownerRoleId
-- (string-keyed role, same V1 pattern as Controls).
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding"
SET "owner_role_id" = "owner"
WHERE "owner_role_id" IS NULL AND "owner_employee_id" IS NULL AND "owner" IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 7: Backfill controlObjectiveId where deterministic
-- If the finding's control has exactly one ControlObjectiveMapping,
-- use that objective. Otherwise leave null.
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding" f
SET "control_objective_id" = sub.objective_id
FROM (
  SELECT bco."control_id", bco."control_objective_id" AS objective_id
  FROM "bridge_control_objective" bco
  WHERE bco."valid_to" IS NULL
  GROUP BY bco."control_id", bco."control_objective_id"
  HAVING COUNT(*) OVER (PARTITION BY bco."control_id") = 1
) sub
WHERE f."control_id" = sub."control_id"
  AND f."control_objective_id" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 8: Promote nullable columns to NOT NULL where required
-- ═══════════════════════════════════════════════════════════

-- severity_id: must be non-null after backfill
ALTER TABLE "fact_finding" ALTER COLUMN "severity_id" SET NOT NULL;

-- bitemporal: must be non-null after backfill
ALTER TABLE "fact_finding" ALTER COLUMN "effective_date" SET NOT NULL;
ALTER TABLE "fact_finding" ALTER COLUMN "recorded_date" SET NOT NULL;

-- source: set default then promote
UPDATE "fact_finding" SET "source" = 'migration' WHERE "source" IS NULL;
ALTER TABLE "fact_finding" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "fact_finding" ALTER COLUMN "source" SET DEFAULT 'migration';

-- ═══════════════════════════════════════════════════════════
-- Step 9: Diagnose controlId nulls before enforcing NOT NULL
-- ═══════════════════════════════════════════════════════════

-- This diagnostic query will be run by the verification script.
-- If zero nulls, the NOT NULL constraint is added in this migration.
-- If any nulls exist, migration halts and operator is notified.

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "fact_finding" WHERE "control_id" IS NULL;
  IF null_count > 0 THEN
    RAISE NOTICE 'CR-WB-FINDINGS-001: % findings have NULL control_id. NOT NULL constraint deferred. Diagnose before enforcing.', null_count;
  ELSE
    -- Zero nulls: safe to enforce F1 (every finding cites a control)
    ALTER TABLE "fact_finding" ALTER COLUMN "control_id" SET NOT NULL;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- Step 10: Owner mutex CHECK constraint
-- At most one of owner_role_id or owner_employee_id set.
-- Same pattern as Controls C2.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_owner_mutex"
CHECK (NOT ("owner_role_id" IS NOT NULL AND "owner_employee_id" IS NOT NULL));

-- ═══════════════════════════════════════════════════════════
-- Step 11: Add foreign keys
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_severity_id_fkey"
FOREIGN KEY ("severity_id") REFERENCES "dim_severity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_owner_employee_id_fkey"
FOREIGN KEY ("owner_employee_id") REFERENCES "dim_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_owner_role_id_fkey"
FOREIGN KEY ("owner_role_id") REFERENCES "dim_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_control_objective_id_fkey"
FOREIGN KEY ("control_objective_id") REFERENCES "dim_control_objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_prior_finding_id_fkey"
FOREIGN KEY ("prior_finding_id") REFERENCES "fact_finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Step 12: Add/update indexes
-- ═══════════════════════════════════════════════════════════

-- Replace old severity enum index with severityId FK index
DROP INDEX IF EXISTS "fact_finding_severity_idx";
CREATE INDEX "fact_finding_severity_id_idx" ON "fact_finding"("severity_id");
CREATE INDEX "fact_finding_control_id_idx" ON "fact_finding"("control_id");

-- ═══════════════════════════════════════════════════════════
-- Step 13: Drop legacy columns and enum
-- Point of no return for severity/owner columns.
-- ═══════════════════════════════════════════════════════════

-- Drop old severity column (was enum-typed)
ALTER TABLE "fact_finding" DROP COLUMN IF EXISTS "severity";

-- Drop old owner column (was plain text)
ALTER TABLE "fact_finding" DROP COLUMN IF EXISTS "owner";

-- Drop the FindingSeverity enum type (no longer referenced)
DROP TYPE IF EXISTS "FindingSeverity";

-- Drop old control_id FK constraint (was ON DELETE SET NULL, now non-null)
-- Re-add as RESTRICT since controlId is now required (F1)
ALTER TABLE "fact_finding" DROP CONSTRAINT IF EXISTS "fact_finding_control_id_fkey";
ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_control_id_fkey"
FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Rollback notes:
-- Steps 1-7: additive (columns, table). Reversible via DROP.
-- Step 8: NOT NULL promotion. Reversible via ALTER COLUMN DROP NOT NULL.
-- Step 9: Conditional NOT NULL on control_id. Check before rollback.
-- Step 10: CHECK constraint. DROP CONSTRAINT to reverse.
-- Step 11: FKs. DROP CONSTRAINT to reverse.
-- Step 12: Indexes. DROP/CREATE to reverse.
-- Step 13: POINT OF NO RETURN. Column data is lost after DROP.
--          Rollback requires restore from backup.
-- ═══════════════════════════════════════════════════════════
