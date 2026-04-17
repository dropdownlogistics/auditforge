// CR-WB-RISK-001 — Post-migration verification.
// Confirms all 4 migrations (dimensions, assessment backfill,
// status change, bridge) landed correctly. 18 checks.
//
// Run: npx tsx scripts/verify-risk-promotion.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const line = "═".repeat(72);
const thin = "─".repeat(72);

type Check = { name: string; pass: boolean; detail?: string };
const results: Check[] = [];

function ok(name: string, detail?: string) { results.push({ name, pass: true, detail }); }
function fail(name: string, detail: string) { results.push({ name, pass: false, detail }); }

async function main() {
  console.log(line);
  console.log("  CR-WB-RISK-001 VERIFICATION — risk register promotion to WorkBench");
  console.log(line);
  console.log();

  // 1. Dim_RiskCategory exists with 8 rows
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>("SELECT category_name FROM dim_risk_category ORDER BY category_name");
    if (rows.length === 8) ok("Dim_RiskCategory exists with 8 rows", rows.map(r => r.category_name).join(", "));
    else fail("Dim_RiskCategory row count", `expected 8, found ${rows.length}`);
  } catch (e) { fail("Dim_RiskCategory exists", `query failed: ${e}`); }

  // 2. Dim_Likelihood exists with 5 rows (ranks 1-5)
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>("SELECT level, rank FROM dim_likelihood ORDER BY rank");
    if (rows.length === 5 && rows[0].rank === 1 && rows[4].rank === 5) ok("Dim_Likelihood exists with 5 rows", rows.map(r => r.level).join(", "));
    else fail("Dim_Likelihood", `expected 5 rows ranks 1-5, found ${rows.length}`);
  } catch (e) { fail("Dim_Likelihood exists", `query failed: ${e}`); }

  // 3. Dim_Impact exists with 5 rows (ranks 1-5)
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>("SELECT level, rank FROM dim_impact ORDER BY rank");
    if (rows.length === 5 && rows[0].rank === 1 && rows[4].rank === 5) ok("Dim_Impact exists with 5 rows", rows.map(r => r.level).join(", "));
    else fail("Dim_Impact", `expected 5 rows ranks 1-5, found ${rows.length}`);
  } catch (e) { fail("Dim_Impact exists", `query failed: ${e}`); }

  // 4. Zero risks with null category_id (R8)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM dim_risk WHERE category_id IS NULL");
    const c = Number(n[0].count);
    if (c === 0) ok("Zero risks with null category_id (R8)", "category backfill complete");
    else fail("category_id null check (R8)", `${c} risks still null`);
  } catch (e) { fail("category_id check", `query failed: ${e}`); }

  // 5. Owner mutex holds (zero with both set) (R2)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM dim_risk WHERE owner_role_id IS NOT NULL AND owner_employee_id IS NOT NULL");
    const c = Number(n[0].count);
    if (c === 0) ok("Owner mutex holds (R2)", "0 risks with both owner fields set");
    else fail("Owner mutex (R2)", `${c} risks have both set`);
  } catch (e) { fail("Owner mutex check", `query failed: ${e}`); }

  // 6. Fact_RiskAssessment count = dim_risk count
  try {
    const risks = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM dim_risk");
    const assessments = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_assessment");
    const rc = Number(risks[0].count); const ac = Number(assessments[0].count);
    if (ac === rc) ok("Fact_RiskAssessment count matches dim_risk", `${ac} assessments for ${rc} risks`);
    else fail("Assessment count mismatch", `${ac} assessments for ${rc} risks`);
  } catch (e) { fail("Assessment count check", `query failed: ${e}`); }

  // 7. Zero assessments with null likelihood_id (R9)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_assessment WHERE likelihood_id IS NULL");
    if (Number(n[0].count) === 0) ok("Zero assessments with null likelihood_id (R9)");
    else fail("likelihood_id null (R9)", `${Number(n[0].count)} null`);
  } catch (e) { fail("likelihood_id check", `query failed: ${e}`); }

  // 8. Zero assessments with null impact_id (R9)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_assessment WHERE impact_id IS NULL");
    if (Number(n[0].count) === 0) ok("Zero assessments with null impact_id (R9)");
    else fail("impact_id null (R9)", `${Number(n[0].count)} null`);
  } catch (e) { fail("impact_id check", `query failed: ${e}`); }

  // 9. Zero assessments with null assessment_type (R10)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_assessment WHERE assessment_type IS NULL");
    if (Number(n[0].count) === 0) ok("Zero assessments with null assessment_type (R10)");
    else fail("assessment_type null (R10)", `${Number(n[0].count)} null`);
  } catch (e) { fail("assessment_type check", `query failed: ${e}`); }

  // 10. All assessments have migration_provenance = 'BACKFILLED_SINGLE'
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_assessment WHERE migration_provenance != 'BACKFILLED_SINGLE'");
    if (Number(n[0].count) === 0) ok("All assessments have migration_provenance = BACKFILLED_SINGLE");
    else fail("migration_provenance check", `${Number(n[0].count)} not BACKFILLED_SINGLE`);
  } catch (e) { fail("migration_provenance check", `query failed: ${e}`); }

  // 11. Fact_RiskStatusChange count = dim_risk count
  try {
    const risks = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM dim_risk");
    const changes = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM fact_risk_status_change");
    const rc = Number(risks[0].count); const sc = Number(changes[0].count);
    if (sc === rc) ok("Fact_RiskStatusChange count matches dim_risk", `${sc} events for ${rc} risks`);
    else fail("Status change count mismatch", `${sc} events for ${rc} risks`);
  } catch (e) { fail("Status change count", `query failed: ${e}`); }

  // 12. Bridge_RiskControl count (informational)
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM bridge_risk_control");
    ok("Bridge_RiskControl count (informational)", `${Number(n[0].count)} mappings`);
  } catch (e) { fail("Bridge_RiskControl check", `query failed: ${e}`); }

  // 13. Legacy columns dropped
  try {
    const cols = await prisma.$queryRawUnsafe<any[]>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_risk' AND column_name IN ('likelihood', 'impact', 'inherent_risk_rating', 'residual_risk_rating', 'category')"
    );
    if (cols.length === 0) ok("Legacy columns dropped from dim_risk", "likelihood, impact, ratings, category all gone");
    else fail("Legacy columns still exist", cols.map(c => c.column_name).join(", "));
  } catch (e) { fail("Legacy column check", `query failed: ${e}`); }

  // 14. Legacy enums dropped
  try {
    const types = await prisma.$queryRawUnsafe<any[]>("SELECT typname FROM pg_type WHERE typname IN ('RiskRating', 'RiskCategory')");
    if (types.length === 0) ok("Legacy enums dropped (RiskRating, RiskCategory)");
    else fail("Legacy enums still exist", types.map(t => t.typname).join(", "));
  } catch (e) { fail("Legacy enum check", `query failed: ${e}`); }

  // 15. is_current_version = true for all dim_risk rows
  try {
    const n = await prisma.$queryRawUnsafe<{count:bigint}[]>("SELECT COUNT(*)::bigint as count FROM dim_risk WHERE is_current_version = false");
    if (Number(n[0].count) === 0) ok("is_current_version = true for all dim_risk rows");
    else fail("is_current_version check", `${Number(n[0].count)} rows with false`);
  } catch (e) { fail("is_current_version check", `query failed: ${e}`); }

  // 16. risk_id unique per company_id (R1)
  try {
    const dupes = await prisma.$queryRawUnsafe<{count:bigint}[]>(
      "SELECT COUNT(*)::bigint as count FROM (SELECT company_id, risk_id, COUNT(*) as c FROM dim_risk GROUP BY company_id, risk_id HAVING COUNT(*) > 1) sub"
    );
    if (Number(dupes[0].count) === 0) ok("risk_id unique per company_id (R1)");
    else fail("risk_id uniqueness (R1)", `${Number(dupes[0].count)} duplicate pairs`);
  } catch (e) { fail("risk_id uniqueness check", `query failed: ${e}`); }

  // 17. inherent_risk_score = likelihood.rank × impact.rank (R11)
  try {
    const bad = await prisma.$queryRawUnsafe<{count:bigint}[]>(`
      SELECT COUNT(*)::bigint as count FROM fact_risk_assessment a
      JOIN dim_likelihood l ON a.likelihood_id = l.id
      JOIN dim_impact i ON a.impact_id = i.id
      WHERE a.inherent_risk_score != l.rank * i.rank
    `);
    if (Number(bad[0].count) === 0) ok("inherent_risk_score = likelihood.rank × impact.rank (R11)", "all scores correct");
    else fail("Score computation (R11)", `${Number(bad[0].count)} incorrect scores`);
  } catch (e) { fail("Score computation check", `query failed: ${e}`); }

  // 18. severity_id correctly mapped (1-4→LOW, 5-9→MEDIUM, 10-16→HIGH, 17-25→CRITICAL)
  try {
    const bad = await prisma.$queryRawUnsafe<{count:bigint}[]>(`
      SELECT COUNT(*)::bigint as count FROM fact_risk_assessment a
      JOIN dim_severity s ON a.severity_id = s.id
      WHERE NOT (
        (a.inherent_risk_score BETWEEN 1 AND 4 AND s.level = 'LOW') OR
        (a.inherent_risk_score BETWEEN 5 AND 9 AND s.level = 'MEDIUM') OR
        (a.inherent_risk_score BETWEEN 10 AND 16 AND s.level = 'HIGH') OR
        (a.inherent_risk_score BETWEEN 17 AND 25 AND s.level = 'CRITICAL')
      )
    `);
    if (Number(bad[0].count) === 0) ok("severity_id correctly mapped for all assessments", "score→severity mapping verified");
    else fail("Severity mapping", `${Number(bad[0].count)} incorrect mappings`);
  } catch (e) { fail("Severity mapping check", `query failed: ${e}`); }

  // ── Report ──
  console.log(thin);
  for (const r of results) {
    const mark = r.pass ? "✓" : "✗";
    console.log(`  ${mark}  ${r.name}`);
    if (r.detail) console.log(`       ${r.detail}`);
  }
  console.log(thin);
  const allPass = results.every(r => r.pass);
  const passCount = results.filter(r => r.pass).length;
  console.log();
  console.log(`  ${allPass ? "✓" : "✗"}  ${passCount} of ${results.length} checks passed`);
  console.log(line);
  await prisma.$disconnect();
  process.exit(allPass ? 0 : 1);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
