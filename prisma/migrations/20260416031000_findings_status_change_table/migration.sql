-- CR-WB-FINDINGS-001 Migration 2
-- Fact_FindingStatusChange — status transition audit trail
-- Step 2 of the extraction plan
--
-- Creates the status change fact table and seeds one row per
-- existing finding (initial state from migration).

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Fact_FindingStatusChange
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "fact_finding_status_change" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL,
    "corrects_fact_id" TEXT,

    -- F8: ACCEPTED_RISK governance
    "approver_employee_id" TEXT,
    "accepted_until_date" TIMESTAMP(3),

    -- F9: closure receipt
    "closure_evidence_fact_id" TEXT,

    CONSTRAINT "fact_finding_status_change_pkey" PRIMARY KEY ("id")
);

-- Index on finding_id for efficient lookups
CREATE INDEX IF NOT EXISTS "fact_finding_status_change_finding_id_idx"
ON "fact_finding_status_change"("finding_id");

-- FK to fact_finding
ALTER TABLE "fact_finding_status_change"
ADD CONSTRAINT "fact_finding_status_change_finding_id_fkey"
FOREIGN KEY ("finding_id") REFERENCES "fact_finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Seed initial status events from existing findings
-- One row per finding: fromStatus = null, toStatus = current status
-- ═══════════════════════════════════════════════════════════

INSERT INTO "fact_finding_status_change" (
    "id",
    "finding_id",
    "from_status",
    "to_status",
    "changed_by",
    "reason",
    "effective_date",
    "recorded_date"
)
SELECT
    'fsc_init_' || "id",
    "id",
    NULL,
    "status"::text,
    'migration',
    'Initial state from CR-WB-FINDINGS-001 migration',
    "created_at",
    NOW()
FROM "fact_finding"
WHERE NOT EXISTS (
    SELECT 1 FROM "fact_finding_status_change" fsc
    WHERE fsc."finding_id" = "fact_finding"."id"
);

-- ═══════════════════════════════════════════════════════════
-- Rollback notes:
-- Step 1: DROP TABLE "fact_finding_status_change" CASCADE;
-- Step 2: Data loss on DROP — seeded rows unrecoverable
--         (but reproducible from fact_finding state).
-- ═══════════════════════════════════════════════════════════
