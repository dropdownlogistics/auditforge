-- CR-WB-FINDINGS-001 — Backfill controlId + enforce F1 NOT NULL
-- Operator-confirmed mapping (2026-04-16):
--   FND-2025-001 → CO-HR-005
--   FND-2025-002 → CO-FIN-003
--   FND-2025-003 → CO-FIN-012
--   FND-2025-004 → CO-VND-002
--   FND-2025-005 → CO-ITGC-006
--   FND-2025-006 → CO-ITGC-007
--   FND-2025-007 → CO-FIN-006
--   FND-2025-008 → CO-HR-006

-- ═══════════════════════════════════════════════════════════
-- Step 1: Backfill controlId from operator-confirmed mapping
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-001' AND c."control_id" = 'CO-HR-005'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-002' AND c."control_id" = 'CO-FIN-003'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-003' AND c."control_id" = 'CO-FIN-012'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-004' AND c."control_id" = 'CO-VND-002'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-005' AND c."control_id" = 'CO-ITGC-006'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-006' AND c."control_id" = 'CO-ITGC-007'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-007' AND c."control_id" = 'CO-FIN-006'
  AND f."control_id" IS NULL;

UPDATE "fact_finding" f
SET "control_id" = c."id"
FROM "fact_control" c
WHERE f."finding_id" = 'FND-2025-008' AND c."control_id" = 'CO-HR-006'
  AND f."control_id" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Verify zero nulls before enforcing
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "fact_finding" WHERE "control_id" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'CR-WB-FINDINGS-001 F1 HALT: % findings still have NULL control_id after backfill. Cannot enforce NOT NULL.', null_count;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- Step 3: Enforce F1 — controlId NOT NULL
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "fact_finding" ALTER COLUMN "control_id" SET NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 4: Upgrade FK to ON DELETE RESTRICT
-- Every finding must cite a control; deleting a control with
-- findings is a structural error.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "fact_finding" DROP CONSTRAINT IF EXISTS "fact_finding_control_id_fkey";
ALTER TABLE "fact_finding"
ADD CONSTRAINT "fact_finding_control_id_fkey"
FOREIGN KEY ("control_id") REFERENCES "fact_control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Step 5: Backfill controlObjectiveId where now deterministic
-- (Findings now have controlId, so the lookup can resolve)
-- ═══════════════════════════════════════════════════════════

UPDATE "fact_finding" f
SET "control_objective_id" = sub.objective_id
FROM (
  SELECT bco."control_id", MIN(bco."control_objective_id") AS objective_id
  FROM "bridge_control_objective" bco
  WHERE bco."valid_to" IS NULL
  GROUP BY bco."control_id"
  HAVING COUNT(DISTINCT bco."control_objective_id") = 1
) sub
WHERE f."control_id" = sub."control_id"
  AND f."control_objective_id" IS NULL;
