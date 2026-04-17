-- CR-WB-RISK-001 Migration 2
-- Fact_RiskAssessment creation + backfill + legacy column drops
-- One INITIAL assessment per risk with 4→5 level mapping.

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Fact_RiskAssessment
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "fact_risk_assessment" (
    "id" TEXT NOT NULL,
    "fact_type" TEXT NOT NULL DEFAULT 'Fact_RiskAssessment',
    "risk_id" TEXT NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "assessor_employee_id" TEXT,
    "assessor_role_id" TEXT,
    "likelihood_id" TEXT NOT NULL,
    "impact_id" TEXT NOT NULL,
    "inherent_risk_score" INTEGER NOT NULL,
    "residual_risk_score" INTEGER,
    "severity_id" TEXT,
    "assessment_type" TEXT NOT NULL,
    "rationale" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL,
    "previous_assessment_id" TEXT,
    "migration_provenance" TEXT NOT NULL DEFAULT 'CLEAN',
    "source" TEXT,
    "source_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fact_risk_assessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fact_risk_assessment_risk_id_idx" ON "fact_risk_assessment"("risk_id");

ALTER TABLE "fact_risk_assessment"
ADD CONSTRAINT "fact_risk_assessment_risk_id_fkey"
FOREIGN KEY ("risk_id") REFERENCES "dim_risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_risk_assessment"
ADD CONSTRAINT "fact_risk_assessment_likelihood_id_fkey"
FOREIGN KEY ("likelihood_id") REFERENCES "dim_likelihood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_risk_assessment"
ADD CONSTRAINT "fact_risk_assessment_impact_id_fkey"
FOREIGN KEY ("impact_id") REFERENCES "dim_impact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fact_risk_assessment"
ADD CONSTRAINT "fact_risk_assessment_severity_id_fkey"
FOREIGN KEY ("severity_id") REFERENCES "dim_severity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Backfill one INITIAL assessment per risk
-- 4-level → 5-level mapping:
--   LOW → UNLIKELY/MINOR (rank 2)
--   MEDIUM → POSSIBLE/MODERATE (rank 3)
--   HIGH → LIKELY/MAJOR (rank 4)
--   CRITICAL → ALMOST_CERTAIN/SEVERE (rank 5)
-- Score = likelihood.rank × impact.rank
-- Severity mapping: 1-4→LOW, 5-9→MEDIUM, 10-16→HIGH, 17-25→CRITICAL
-- ═══════════════════════════════════════════════════════════

INSERT INTO "fact_risk_assessment" (
  "id", "risk_id", "assessment_date",
  "likelihood_id", "impact_id",
  "inherent_risk_score", "severity_id",
  "assessment_type", "rationale",
  "effective_date", "recorded_date",
  "migration_provenance", "source"
)
SELECT
  'fra_init_' || r."id",
  r."id",
  r."created_at",
  -- likelihood mapping
  CASE r."likelihood"::text
    WHEN 'LOW'      THEN 'lh_unlikely'
    WHEN 'MEDIUM'   THEN 'lh_possible'
    WHEN 'HIGH'     THEN 'lh_likely'
    WHEN 'CRITICAL' THEN 'lh_almost_certain'
  END,
  -- impact mapping
  CASE r."impact"::text
    WHEN 'LOW'      THEN 'imp_minor'
    WHEN 'MEDIUM'   THEN 'imp_moderate'
    WHEN 'HIGH'     THEN 'imp_major'
    WHEN 'CRITICAL' THEN 'imp_severe'
  END,
  -- inherent_risk_score = likelihood_rank × impact_rank
  (CASE r."likelihood"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
  *
  (CASE r."impact"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END),
  -- severity_id from score
  CASE
    WHEN (CASE r."likelihood"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       * (CASE r."impact"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       <= 4 THEN 'sev_low'
    WHEN (CASE r."likelihood"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       * (CASE r."impact"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       <= 9 THEN 'sev_medium'
    WHEN (CASE r."likelihood"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       * (CASE r."impact"::text WHEN 'LOW' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'HIGH' THEN 4 WHEN 'CRITICAL' THEN 5 END)
       <= 16 THEN 'sev_high'
    ELSE 'sev_critical'
  END,
  'INITIAL',
  'Migrated from AuditForge dim_risk. Historical assessment changes not preserved.',
  r."created_at",
  NOW(),
  'BACKFILLED_SINGLE',
  'migration'
FROM "dim_risk" r
WHERE NOT EXISTS (
  SELECT 1 FROM "fact_risk_assessment" a WHERE a."risk_id" = r."id"
);

-- ═══════════════════════════════════════════════════════════
-- Step 3: Drop legacy columns from dim_risk
-- POINT OF NO RETURN for assessment data.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "dim_risk" DROP COLUMN IF EXISTS "likelihood";
ALTER TABLE "dim_risk" DROP COLUMN IF EXISTS "impact";
ALTER TABLE "dim_risk" DROP COLUMN IF EXISTS "inherent_risk_rating";
ALTER TABLE "dim_risk" DROP COLUMN IF EXISTS "residual_risk_rating";

-- Drop legacy category enum column (replaced by category_id FK)
ALTER TABLE "dim_risk" DROP COLUMN IF EXISTS "category";

-- Drop legacy enums
DROP TYPE IF EXISTS "RiskRating";
DROP TYPE IF EXISTS "RiskCategory";
