// CR-WB-CONTROLS-001 — Post-migration verification.
// Confirms all three migrations (Assertion rename, owner split + bitemporal,
// audit trail cleanup) landed correctly. Structured pass/fail output matching
// the WorkBench verify-* pattern.
//
// Run: npx tsx scripts/verify-controls-promotion.ts
// (from C:\Users\dkitc\auditforge)

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const line = "═".repeat(72);
const thin = "─".repeat(72);

type Check = { name: string; pass: boolean; detail?: string };
const results: Check[] = [];

function ok(name: string, detail?: string) {
  results.push({ name, pass: true, detail });
}
function fail(name: string, detail: string) {
  results.push({ name, pass: false, detail });
}

async function main() {
  console.log(line);
  console.log("  CR-WB-CONTROLS-001 VERIFICATION — controls promotion to WorkBench");
  console.log(line);
  console.log();

  // ── 1. Zero controls with null controlTypeId ──
  try {
    const nullTypeCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM fact_control WHERE control_type_id IS NULL
    `;
    const n = Number(nullTypeCount[0].count);
    if (n === 0) {
      ok("Zero controls with null controlTypeId", "legacy enum fully migrated");
    } else {
      fail("Zero controls with null controlTypeId", `${n} controls still null`);
    }
  } catch (e) {
    fail("Zero controls with null controlTypeId", `query failed: ${e}`);
  }

  // ── 2. Owner mutex (at most one of ownerRoleId/ownerEmployeeId) ──
  try {
    const bothSet = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM fact_control
      WHERE owner_role_id IS NOT NULL AND owner_employee_id IS NOT NULL
    `;
    const n = Number(bothSet[0].count);
    if (n === 0) {
      ok("Owner mutex holds (at most one owner FK set)", "0 controls with both set");
    } else {
      fail("Owner mutex holds", `${n} controls have both ownerRoleId + ownerEmployeeId set`);
    }
  } catch (e) {
    fail("Owner mutex", `query failed: ${e}`);
  }

  // ── 3. Owner assignment (at least one owner set) — informational ──
  try {
    const bothNull = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM fact_control
      WHERE owner_role_id IS NULL AND owner_employee_id IS NULL
    `;
    const n = Number(bothNull[0].count);
    if (n === 0) {
      ok("Every control has an owner assigned", "0 unassigned");
    } else {
      // Softened per migration: both-null permitted for unassigned rows
      ok(
        "Owner assignment (informational — both-null permitted per migration-2 softening)",
        `${n} controls unassigned (ownerRoleId + ownerEmployeeId both null)`,
      );
    }
  } catch (e) {
    fail("Owner assignment check", `query failed: ${e}`);
  }

  // ── 4. Bitemporal fields populated on every control ──
  try {
    const missing = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM fact_control
      WHERE effective_date IS NULL OR recorded_date IS NULL
    `;
    const n = Number(missing[0].count);
    if (n === 0) {
      ok("Every control has effectiveDate + recordedDate", "bitemporal backfill complete");
    } else {
      fail("Every control has effectiveDate + recordedDate", `${n} controls missing one or both`);
    }
  } catch (e) {
    fail("Bitemporal fields", `query failed: ${e}`);
  }

  // ── 5. dim_owner table dropped ──
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'dim_owner'
    `;
    if (tables.length === 0) {
      ok("dim_owner table dropped", "table does not exist");
    } else {
      fail("dim_owner table dropped", `table still exists`);
    }
  } catch (e) {
    fail("dim_owner check", `query failed: ${e}`);
  }

  // ── 6. Legacy controlType column dropped ──
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fact_control' AND column_name = 'control_type'
    `;
    if (cols.length === 0) {
      ok("Legacy control_type column dropped from fact_control", "column does not exist");
    } else {
      fail("Legacy control_type column dropped", `column still exists`);
    }
  } catch (e) {
    fail("Legacy column check", `query failed: ${e}`);
  }

  // ── 7. dim_control_objective table exists ──
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'dim_control_objective'
    `;
    if (tables.length === 1) {
      const count = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM dim_control_objective
      `;
      ok("dim_control_objective table exists", `${Number(count[0].count)} rows`);
    } else {
      fail("dim_control_objective table exists", `found ${tables.length}, expected 1`);
    }
  } catch (e) {
    fail("dim_control_objective check", `query failed: ${e}`);
  }

  // ── 8. dim_assertion renamed (no longer exists) ──
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'dim_assertion'
    `;
    if (tables.length === 0) {
      ok("dim_assertion renamed (legacy name no longer exists)", "rename complete");
    } else {
      fail("dim_assertion renamed", `legacy table still exists`);
    }
  } catch (e) {
    fail("dim_assertion rename check", `query failed: ${e}`);
  }

  // ── 9. ControlStatusLog has effective/recorded dates ──
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sys_control_status_log'
        AND column_name IN ('effective_date', 'recorded_date', 'corrects_fact_id')
    `;
    if (cols.length === 3) {
      ok("ControlStatusLog has bitemporal fields", "effective_date, recorded_date, corrects_fact_id present");
    } else {
      fail("ControlStatusLog bitemporal fields", `${cols.length} of 3 expected fields present`);
    }
  } catch (e) {
    fail("ControlStatusLog check", `query failed: ${e}`);
  }

  // ── 10. Framework has frameworkVersion, all non-null ──
  try {
    const nullCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM dim_framework WHERE framework_version IS NULL
    `;
    const n = Number(nullCount[0].count);
    if (n === 0) {
      ok("Framework.frameworkVersion non-null for all rows", "Step 5 backfill complete");
    } else {
      fail("Framework.frameworkVersion non-null", `${n} frameworks still null`);
    }
  } catch (e) {
    fail("Framework version check", `query failed: ${e}`);
  }

  // ── 11. AuditTrail singular value columns dropped ──
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sys_audit_trail'
        AND column_name IN ('previous_value', 'new_value')
    `;
    if (cols.length === 0) {
      ok("AuditTrail singular value columns dropped", "normalized to Json plural only");
    } else {
      fail("AuditTrail singular columns dropped", `${cols.length} still exist: ${cols.map((c) => c.column_name).join(", ")}`);
    }
  } catch (e) {
    fail("AuditTrail cleanup check", `query failed: ${e}`);
  }

  // ── 12. bridge_control_objective exists (bridge rename) ──
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('bridge_control_assertion', 'bridge_control_objective')
    `;
    const names = tables.map((t) => t.table_name);
    if (names.includes("bridge_control_objective") && !names.includes("bridge_control_assertion")) {
      ok("bridge table renamed to bridge_control_objective", "legacy name dropped");
    } else {
      fail("bridge table rename", `tables found: ${names.join(", ")}`);
    }
  } catch (e) {
    fail("bridge rename check", `query failed: ${e}`);
  }

  // ── Report ──
  console.log(thin);
  for (const r of results) {
    const mark = r.pass ? "✓" : "✗";
    console.log(`  ${mark}  ${r.name}`);
    if (r.detail) console.log(`       ${r.detail}`);
  }
  console.log(thin);

  const allPass = results.every((r) => r.pass);
  const passCount = results.filter((r) => r.pass).length;
  console.log();
  console.log(`  ${allPass ? "✓" : "✗"}  ${passCount} of ${results.length} checks passed`);
  console.log(line);

  await prisma.$disconnect();
  process.exit(allPass ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
