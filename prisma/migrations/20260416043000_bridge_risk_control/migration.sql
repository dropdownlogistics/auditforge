-- CR-WB-RISK-001 Migration 4
-- Bridge_RiskControl creation + migrate from existing bridge_control_risk

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Bridge_RiskControl
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "bridge_risk_control" (
    "id" TEXT NOT NULL,
    "risk_id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "mitigation_type" TEXT NOT NULL DEFAULT 'PRIMARY',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bridge_risk_control_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bridge_risk_control"
ADD CONSTRAINT "bridge_risk_control_risk_id_fkey"
FOREIGN KEY ("risk_id") REFERENCES "dim_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bridge_risk_control"
ADD CONSTRAINT "bridge_risk_control_unique"
UNIQUE ("risk_id", "control_id", "effective_to");

-- ═══════════════════════════════════════════════════════════
-- Step 2: Migrate from existing bridge_control_risk
-- The existing table uses controlId→fact_control.id and
-- riskId→dim_risk.id as composite PK.
-- ═══════════════════════════════════════════════════════════

INSERT INTO "bridge_risk_control" (
    "id", "risk_id", "control_id",
    "mitigation_type", "effective_from", "effective_to"
)
SELECT
    'brc_' || bcr."control_id" || '_' || bcr."risk_id",
    bcr."risk_id",
    c."control_id",
    'PRIMARY',
    bcr."valid_from",
    bcr."valid_to"
FROM "bridge_control_risk" bcr
JOIN "fact_control" c ON bcr."control_id" = c."id"
WHERE NOT EXISTS (
    SELECT 1 FROM "bridge_risk_control" brc
    WHERE brc."risk_id" = bcr."risk_id"
      AND brc."control_id" = c."control_id"
);
