// CR-WB-FINDINGS-001 — Diagnose findings with null controlId
// 8 findings reported null. Surface details before enforcing F1.
//
// Run: npx tsx scripts/diagnose-null-controlid.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const nullFindings = await prisma.$queryRaw<any[]>`
    SELECT f.finding_id, f.title, f.severity::text as severity, f.status::text as status, f.owner,
           a.audit_id, a.audit_name
    FROM fact_finding f
    JOIN fact_audit a ON f.audit_id = a.id
    WHERE f.control_id IS NULL
    ORDER BY f.finding_id
  `;

  console.log(`\nFindings with null controlId: ${nullFindings.length}\n`);
  console.log("─".repeat(72));

  for (const f of nullFindings) {
    console.log(`  ${f.finding_id} | ${f.severity} | ${f.status}`);
    console.log(`    Title: ${f.title}`);
    console.log(`    Owner: ${f.owner}`);
    console.log(`    Audit: ${f.audit_id} (${f.audit_name})`);
    console.log("─".repeat(72));
  }

  // Check total findings for context
  const total = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM fact_finding
  `;
  console.log(`\nTotal findings: ${Number(total[0].count)}`);
  console.log(`Null controlId: ${nullFindings.length}`);
  console.log(`Non-null controlId: ${Number(total[0].count) - nullFindings.length}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
