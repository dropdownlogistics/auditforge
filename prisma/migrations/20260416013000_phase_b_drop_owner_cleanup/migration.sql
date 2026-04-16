-- Phase B: Drop dim_owner table and owner_id FK on fact_control.
-- All 106 controls have null owner_id — no data loss.
-- Ownership now via owner_employee_id / owner_role_id (Phase A additions).

-- Drop FK constraint from fact_control → dim_owner
ALTER TABLE "fact_control" DROP CONSTRAINT IF EXISTS "fact_control_owner_id_fkey";

-- Drop owner_id column from fact_control
ALTER TABLE "fact_control" DROP COLUMN IF EXISTS "owner_id";

-- Drop dim_owner table
DROP TABLE IF EXISTS "dim_owner";
