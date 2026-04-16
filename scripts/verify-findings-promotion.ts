// CR-WB-FINDINGS-001 — Post-migration verification.
// Confirms all three migrations (Dim_Severity, Finding extensions,
// FindingStatusChange) landed correctly. Structured pass/fail output
// matching the verify-controls-promotion.ts pattern.
//
// Run: npx tsx scripts/verify-findings-promotion.ts
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
  console.log("  CR-WB-FINDINGS-001 VERIFICATION — findings promotion to WorkBench");
  console.log(line);
  console.log();

  // ── 1. Dim_Severity exists with 4 rows (LOW/MEDIUM/HIGH/CRITICAL) ──
  try {
    const rows = await prisma.$queryRaw<{ level: string; rank: number }[]>`
      SELECT "level", "rank" FROM "dim_severity" ORDER BY "rank"
    `;
    if (rows.length === 4) {
      const levels = rows.map((r) => r.level).join(", ");
      ok("Dim_Severity exists with 4 rows", levels);
    } else {
      fail("Dim_Severity row count", `expected 4, found ${rows.length}`);
    }
  } catch (e) {
    fail("Dim_Severity exists", `query failed: ${e}`);
  }

  // ── 2. Zero findings with null severityId ──
  try {
    const nullCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding" WHERE "severity_id" IS NULL
    `;
    const n = Number(nullCount[0].count);
    if (n === 0) {
      ok("Zero findings with null severityId", "severity backfill complete");
    } else {
      fail("Zero findings with null severityId", `${n} findings still null`);
    }
  } catch (e) {
    fail("severityId null check", `query failed: ${e}`);
  }

  // ── 3. Owner mutex (at most one of ownerRoleId/ownerEmployeeId) ──
  try {
    const bothSet = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding"
      WHERE "owner_role_id" IS NOT NULL AND "owner_employee_id" IS NOT NULL
    `;
    const n = Number(bothSet[0].count);
    if (n === 0) {
      ok("Owner mutex holds (at most one owner FK set)", "0 findings with both set");
    } else {
      fail("Owner mutex holds", `${n} findings have both ownerRoleId + ownerEmployeeId set`);
    }
  } catch (e) {
    fail("Owner mutex", `query failed: ${e}`);
  }

  // ── 4. All findings have effectiveDate and recordedDate ──
  try {
    const missing = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding"
      WHERE "effective_date" IS NULL OR "recorded_date" IS NULL
    `;
    const n = Number(missing[0].count);
    if (n === 0) {
      ok("All findings have effectiveDate + recordedDate", "bitemporal backfill complete");
    } else {
      fail("Bitemporal fields", `${n} findings missing one or both`);
    }
  } catch (e) {
    fail("Bitemporal fields", `query failed: ${e}`);
  }

  // ── 5. fact_finding_status_change table exists with one row per finding ──
  try {
    const findingCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding"
    `;
    const statusChangeCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding_status_change"
    `;
    const fc = Number(findingCount[0].count);
    const sc = Number(statusChangeCount[0].count);
    if (sc >= fc) {
      ok("FindingStatusChange table seeded", `${sc} status changes for ${fc} findings`);
    } else {
      fail("FindingStatusChange seed", `${sc} status changes for ${fc} findings — expected >= ${fc}`);
    }
  } catch (e) {
    fail("FindingStatusChange table exists", `query failed: ${e}`);
  }

  // ── 6. Every FindingStatusChange.findingId resolves to a valid Finding ──
  try {
    const orphans = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding_status_change" fsc
      LEFT JOIN "fact_finding" f ON fsc."finding_id" = f."id"
      WHERE f."id" IS NULL
    `;
    const n = Number(orphans[0].count);
    if (n === 0) {
      ok("All FindingStatusChange.findingId resolves to valid Finding", "0 orphans");
    } else {
      fail("FindingStatusChange FK integrity", `${n} orphaned status changes`);
    }
  } catch (e) {
    fail("FindingStatusChange FK check", `query failed: ${e}`);
  }

  // ── 7. Finding.controlId resolves to a valid fact_control (F1) ──
  try {
    const orphans = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding" f
      LEFT JOIN "fact_control" c ON f."control_id" = c."id"
      WHERE f."control_id" IS NOT NULL AND c."id" IS NULL
    `;
    const n = Number(orphans[0].count);
    if (n === 0) {
      ok("Every finding.controlId resolves to valid fact_control (F1)", "cross-promoted sibling FK holds");
    } else {
      fail("Cross-promoted sibling FK (F1)", `${n} findings reference non-existent controls`);
    }

    // Also check for null controlIds
    const nullControls = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding" WHERE "control_id" IS NULL
    `;
    const nc = Number(nullControls[0].count);
    if (nc === 0) {
      ok("Zero findings with null controlId", "F1 constraint enforced — every finding cites a control");
    } else {
      fail("controlId NOT NULL (F1)", `${nc} findings have null controlId — diagnose before enforcing`);
    }
  } catch (e) {
    fail("controlId FK check", `query failed: ${e}`);
  }

  // ── 8. controlObjectiveId populated where deterministic ──
  try {
    const populated = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding" WHERE "control_objective_id" IS NOT NULL
    `;
    const total = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "fact_finding"
    `;
    const p = Number(populated[0].count);
    const t = Number(total[0].count);
    ok("controlObjectiveId backfill (informational)", `${p} of ${t} findings have controlObjectiveId populated`);
  } catch (e) {
    fail("controlObjectiveId check", `query failed: ${e}`);
  }

  // ── 9. Legacy severity column does not exist on fact_finding ──
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fact_finding' AND column_name = 'severity'
    `;
    if (cols.length === 0) {
      ok("Legacy severity column dropped from fact_finding", "column does not exist");
    } else {
      fail("Legacy severity column dropped", `column still exists`);
    }
  } catch (e) {
    fail("Legacy severity check", `query failed: ${e}`);
  }

  // ── 10. Legacy owner (String) column does not exist on fact_finding ──
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'fact_finding' AND column_name = 'owner'
    `;
    if (cols.length === 0) {
      ok("Legacy owner column dropped from fact_finding", "column does not exist");
    } else {
      fail("Legacy owner column dropped", `column still exists`);
    }
  } catch (e) {
    fail("Legacy owner check", `query failed: ${e}`);
  }

  // ── 11. FindingSeverity enum type does not exist ──
  try {
    const types = await prisma.$queryRaw<{ typname: string }[]>`
      SELECT typname FROM pg_type WHERE typname = 'FindingSeverity'
    `;
    if (types.length === 0) {
      ok("FindingSeverity enum type dropped", "type does not exist");
    } else {
      fail("FindingSeverity enum type dropped", `type still exists`);
    }
  } catch (e) {
    fail("FindingSeverity enum check", `query failed: ${e}`);
  }

  // ── 12. Owner mutex CHECK constraint exists ──
  try {
    const constraints = await prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'fact_finding'::regclass AND conname = 'fact_finding_owner_mutex'
    `;
    if (constraints.length === 1) {
      ok("Owner mutex CHECK constraint exists on fact_finding", "fact_finding_owner_mutex");
    } else {
      fail("Owner mutex CHECK constraint", `expected 1, found ${constraints.length}`);
    }
  } catch (e) {
    fail("Owner mutex constraint check", `query failed: ${e}`);
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
