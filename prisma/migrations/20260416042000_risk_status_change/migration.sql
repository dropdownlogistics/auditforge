-- CR-WB-RISK-001 Migration 3
-- Fact_RiskStatusChange creation + seed initial events.
-- Note: dim_risk has no "status" column — all risks seeded as ACTIVE.

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Fact_RiskStatusChange
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "fact_risk_status_change" (
    "id" TEXT NOT NULL,
    "risk_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT,
    "reason" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL,
    "corrects_fact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fact_risk_status_change_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fact_risk_status_change_risk_id_idx" ON "fact_risk_status_change"("risk_id");

ALTER TABLE "fact_risk_status_change"
ADD CONSTRAINT "fact_risk_status_change_risk_id_fkey"
FOREIGN KEY ("risk_id") REFERENCES "dim_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Seed one initial status event per risk
-- dim_risk has no status column — default all to ACTIVE
-- ═══════════════════════════════════════════════════════════

INSERT INTO "fact_risk_status_change" (
    "id", "risk_id", "from_status", "to_status",
    "changed_by", "reason",
    "effective_date", "recorded_date"
)
SELECT
    'frsc_init_' || r."id",
    r."id",
    NULL,
    'ACTIVE',
    'migration',
    'Initial status captured during migration from AuditForge dim_risk. No prior status column existed — defaulted to ACTIVE.',
    r."created_at",
    NOW()
FROM "dim_risk" r
WHERE NOT EXISTS (
    SELECT 1 FROM "fact_risk_status_change" sc WHERE sc."risk_id" = r."id"
);
