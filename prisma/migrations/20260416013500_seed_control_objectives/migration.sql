-- Deferred from 20260416013000: insert non-audit control objectives
-- using the GENERAL enum value (now committed from prior migration).

INSERT INTO "dim_control_objective" ("id", "objective_name", "category", "description", "objective_category")
VALUES
  (gen_random_uuid()::text, 'Confidentiality', 'GENERAL',
   'Information is accessible only to authorized individuals and systems.',
   'security'),
  (gen_random_uuid()::text, 'Integrity', 'GENERAL',
   'Information is accurate, complete, and protected from unauthorized modification.',
   'security'),
  (gen_random_uuid()::text, 'Availability', 'GENERAL',
   'Information and systems are accessible and usable when needed.',
   'security'),
  (gen_random_uuid()::text, 'Compliance', 'GENERAL',
   'Operations and processes conform to applicable laws, regulations, and contractual requirements.',
   'compliance')
ON CONFLICT ("objective_name") DO NOTHING;
