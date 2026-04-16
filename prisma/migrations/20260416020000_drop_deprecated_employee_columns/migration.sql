-- Phase C: Drop deprecated columns from dim_employee
-- Canonical data now lives in dim_auditor_profile (independence, firm, specializations, bio, councilSeat)
-- and fact_token_assessment (strength/weakness tokens).
-- Pre-flight: 47 auditor profiles verified, all UI refactored off flat columns.

ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "specializations";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "bio";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "councilSeat";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "strengths";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "weaknesses";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "strength_tokens";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "weakness_tokens";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "independence";
ALTER TABLE "dim_employee" DROP COLUMN IF EXISTS "firm";
