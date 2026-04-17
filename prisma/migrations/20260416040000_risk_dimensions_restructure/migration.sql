-- CR-WB-RISK-001 Migration 1
-- New dimensions + Dim_Risk restructure (maturation split step 1)
-- Creates dim_risk_category, dim_likelihood, dim_impact.
-- Adds owner split, bitemporal, version tracking to dim_risk.

-- ═══════════════════════════════════════════════════════════
-- Step 1: Create Dim_RiskCategory
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "dim_risk_category" (
    "id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dim_risk_category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dim_risk_category_category_name_key" ON "dim_risk_category"("category_name");

INSERT INTO "dim_risk_category" ("id", "category_name", "description") VALUES
  ('rcat_financial',    'Financial',       'Risks related to financial reporting, revenue, liquidity'),
  ('rcat_operational',  'Operational',     'Risks related to processes, systems, people'),
  ('rcat_compliance',   'Compliance',      'Risks related to regulatory and legal compliance'),
  ('rcat_cybersec',     'Cybersecurity',   'Risks related to information security and data protection'),
  ('rcat_strategic',    'Strategic',       'Risks related to business strategy and market position'),
  ('rcat_reputational', 'Reputational',    'Risks related to brand, public perception, stakeholder trust'),
  ('rcat_health',       'Health & Safety', 'Risks related to workplace safety and employee health'),
  ('rcat_environmental','Environmental',   'Risks related to environmental impact and sustainability')
ON CONFLICT ("category_name") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Create Dim_Likelihood (5-level)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "dim_likelihood" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dim_likelihood_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dim_likelihood_level_key" ON "dim_likelihood"("level");
CREATE UNIQUE INDEX IF NOT EXISTS "dim_likelihood_rank_key" ON "dim_likelihood"("rank");

INSERT INTO "dim_likelihood" ("id", "level", "rank", "label", "description") VALUES
  ('lh_rare',           'RARE',            1, 'Rare',            'Highly unlikely to occur'),
  ('lh_unlikely',       'UNLIKELY',        2, 'Unlikely',        'Not expected but possible'),
  ('lh_possible',       'POSSIBLE',        3, 'Possible',        'Could occur at some point'),
  ('lh_likely',         'LIKELY',           4, 'Likely',          'Expected to occur'),
  ('lh_almost_certain', 'ALMOST_CERTAIN',  5, 'Almost Certain',  'Expected to occur in most circumstances')
ON CONFLICT ("level") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Step 3: Create Dim_Impact (5-level)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "dim_impact" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dim_impact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dim_impact_level_key" ON "dim_impact"("level");
CREATE UNIQUE INDEX IF NOT EXISTS "dim_impact_rank_key" ON "dim_impact"("rank");

INSERT INTO "dim_impact" ("id", "level", "rank", "label", "description") VALUES
  ('imp_negligible', 'NEGLIGIBLE', 1, 'Negligible', 'Insignificant impact'),
  ('imp_minor',      'MINOR',      2, 'Minor',      'Low impact, easily managed'),
  ('imp_moderate',   'MODERATE',   3, 'Moderate',   'Noticeable impact requiring response'),
  ('imp_major',      'MAJOR',      4, 'Major',      'Significant impact on objectives'),
  ('imp_severe',     'SEVERE',     5, 'Severe',     'Catastrophic impact on the organization')
ON CONFLICT ("level") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Step 4: Add new columns to dim_risk (nullable first)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "category_id" TEXT;
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "owner_role_id" TEXT;
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "owner_employee_id" TEXT;
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "effective_date" TIMESTAMP(3);
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "recorded_date" TIMESTAMP(3);
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "previous_version_id" TEXT;
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "is_current_version" BOOLEAN DEFAULT true;
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'migration';
ALTER TABLE "dim_risk" ADD COLUMN IF NOT EXISTS "source_record_id" TEXT;

-- ═══════════════════════════════════════════════════════════
-- Step 5: Backfill dim_risk fields
-- ═══════════════════════════════════════════════════════════

-- category_id: map RiskCategory enum → dim_risk_category
UPDATE "dim_risk" SET "category_id" = CASE "category"::text
  WHEN 'FINANCIAL'   THEN 'rcat_financial'
  WHEN 'OPERATIONAL' THEN 'rcat_operational'
  WHEN 'COMPLIANCE'  THEN 'rcat_compliance'
  WHEN 'STRATEGIC'   THEN 'rcat_strategic'
  WHEN 'TECHNOLOGY'  THEN 'rcat_cybersec'
END WHERE "category_id" IS NULL;

-- Handle any nulls (shouldn't be, but safety)
UPDATE "dim_risk" SET "category_id" = 'rcat_operational'
WHERE "category_id" IS NULL;

-- effective_date + recorded_date from created_at
UPDATE "dim_risk" SET "effective_date" = "created_at"
WHERE "effective_date" IS NULL;

UPDATE "dim_risk" SET "recorded_date" = "created_at"
WHERE "recorded_date" IS NULL;

-- source defaults
UPDATE "dim_risk" SET "source" = 'migration' WHERE "source" IS NULL;
UPDATE "dim_risk" SET "is_current_version" = true WHERE "is_current_version" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 6: Promote to NOT NULL where required
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "dim_risk" ALTER COLUMN "effective_date" SET NOT NULL;
ALTER TABLE "dim_risk" ALTER COLUMN "recorded_date" SET NOT NULL;
ALTER TABLE "dim_risk" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "dim_risk" ALTER COLUMN "is_current_version" SET NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- Step 7: Owner mutex CHECK (both-null allowed for Risk)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "dim_risk"
ADD CONSTRAINT "risk_owner_mutex"
CHECK (NOT ("owner_role_id" IS NOT NULL AND "owner_employee_id" IS NOT NULL));

-- ═══════════════════════════════════════════════════════════
-- Step 8: Category FK
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "dim_risk"
ADD CONSTRAINT "dim_risk_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "dim_risk_category"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
