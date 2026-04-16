-- ============================================================================
-- Migration 4/3: CR-WB-CONTROLS-001 closeout backfill
-- Resolve 25 null controlTypeId rows via priority-ordered domain match.
--
-- Original Migration 1 Step 2a matched only on domain='BUSINESS'. The 25
-- remaining nulls were AUTOMATED controls in IT/security processes whose
-- correct dim_control_type row has domain='IT' (or HYBRID). This migration
-- walks the domain hierarchy (IT → HYBRID → BUSINESS) idempotently.
--
-- Idempotency: every UPDATE filters on control_type_id IS NULL.
-- Rollback: UPDATE fact_control SET control_type_id = NULL
--          WHERE id IN (<set written by this migration>).
-- ============================================================================

-- Priority 1: IT domain match
UPDATE fact_control fc
   SET control_type_id = ct.id
  FROM dim_control_type ct
 WHERE fc.control_type_id IS NULL
   AND ct.automation::text = fc.control_nature::text
   AND ct.domain = 'IT';

-- Priority 2: HYBRID domain match for remaining nulls
UPDATE fact_control fc
   SET control_type_id = ct.id
  FROM dim_control_type ct
 WHERE fc.control_type_id IS NULL
   AND ct.automation::text = fc.control_nature::text
   AND ct.domain = 'HYBRID';

-- Priority 3: BUSINESS domain match for remaining nulls
UPDATE fact_control fc
   SET control_type_id = ct.id
  FROM dim_control_type ct
 WHERE fc.control_type_id IS NULL
   AND ct.automation::text = fc.control_nature::text
   AND ct.domain = 'BUSINESS';
