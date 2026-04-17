// CR-WB-FINDINGS-001 — Propose controlId mapping for 8 null-controlId findings
// Surfaces finding title + top candidate controls by process area + description match.
//
// Run: npx tsx scripts/propose-controlid-mapping.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const line = "═".repeat(72);
const thin = "─".repeat(72);

async function main() {
  console.log(line);
  console.log("  CR-WB-FINDINGS-001 — controlId MAPPING PROPOSAL");
  console.log(line);
  console.log();

  // Get all findings with null controlId
  const findings = await prisma.$queryRawUnsafe<any[]>(`
    SELECT f.id, f.finding_id, f.title, f.description,
           a.audit_id, a.audit_name
    FROM fact_finding f
    JOIN fact_audit a ON f.audit_id = a.id
    WHERE f.control_id IS NULL
    ORDER BY f.finding_id
  `);

  // Get all controls with their process area info
  const controls = await prisma.$queryRawUnsafe<any[]>(`
    SELECT c.id, c.control_id, c.control_description,
           p.process_area, p.process_name,
           ct.nature, ct.domain
    FROM fact_control c
    JOIN dim_process p ON c.process_id = p.id
    LEFT JOIN dim_control_type ct ON c.control_type_id = ct.id
    ORDER BY c.control_id
  `);

  console.log(`  Total controls available: ${controls.length}`);
  console.log(`  Findings needing controlId: ${findings.length}`);
  console.log();

  // Simple keyword matching for proposal
  for (const f of findings) {
    console.log(thin);
    console.log(`  FINDING: ${f.finding_id}`);
    console.log(`  Title:   ${f.title}`);
    console.log(`  Desc:    ${f.description.substring(0, 120)}...`);
    console.log(`  Audit:   ${f.audit_id} (${f.audit_name})`);
    console.log();

    // Extract keywords from finding title
    const titleWords = f.title.toLowerCase().split(/\s+/);
    const descWords = f.description.toLowerCase().split(/\s+/);
    const allWords = [...titleWords, ...descWords];

    // Score each control by keyword overlap
    const scored = controls.map((c: any) => {
      const controlText = `${c.control_id} ${c.control_description} ${c.process_area} ${c.process_name}`.toLowerCase();
      let score = 0;
      for (const w of allWords) {
        if (w.length > 3 && controlText.includes(w)) score++;
      }
      return { ...c, score };
    });

    // Top 3 candidates
    const top = scored
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);

    if (top.length === 0) {
      console.log("  CANDIDATES: No keyword matches. Manual assignment needed.");
    } else {
      console.log("  CANDIDATES:");
      for (const c of top) {
        console.log(`    ${c.control_id} (score: ${c.score}) | ${c.domain || '?'} | ${c.process_area} > ${c.process_name}`);
        console.log(`      ${c.control_description.substring(0, 100)}`);
      }
    }
    console.log();
  }

  console.log(thin);
  console.log();
  console.log("  Review above proposals. Operator selects one control per finding.");
  console.log("  Format: finding_id → control_id");
  console.log(line);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
