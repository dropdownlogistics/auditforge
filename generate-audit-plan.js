// Generate DDL Audit Plan from live data
// Run: node generate-audit-plan.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const { generateAuditPlan } = require("./src/lib/generators/audit-plan-generator");

const prisma = new PrismaClient();

async function main() {
  console.log("Querying audit data...");

  const audit = await prisma.audit.findUnique({
    where: { auditId: "AUD-2025-001" },
    include: { leadAuditor: true, period: true },
  });

  if (!audit) {
    console.error("Audit AUD-2025-001 not found. Run seed-v04.js first.");
    process.exit(1);
  }

  const scope = await prisma.auditControlScope.findMany({
    where: { auditId: audit.id, validTo: null },
    include: {
      control: {
        include: {
          process: true,
          owner: true,
          risks: { where: { validTo: null }, include: { risk: true } },
        },
      },
      assignedTo: true,
    },
    orderBy: { control: { controlId: "asc" } },
  });

  const outputDir = path.join(__dirname, "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Generating Audit Plan for ${audit.auditId}...`);
  console.log(`  Scope: ${scope.length} controls`);
  console.log(`  Lead: ${audit.leadAuditor.auditorName} (${audit.leadAuditor.certifications})`);

  const result = await generateAuditPlan({
    audit: {
      ...audit,
      leadAuditorName: audit.leadAuditor.auditorName,
    },
    scope,
    companyName: "Dropdown Logistics",
    periodLabel: audit.period.periodLabel,
    outputDir,
  });

  console.log(`\n\u2705 AUDIT PLAN GENERATED`);
  console.log(`   File: ${result.fileName}`);
  console.log(`   Path: ${result.filePath}`);
  console.log(`   Audit: ${audit.auditId} — ${audit.auditName}`);
  console.log(`   Status: ${audit.status}`);
  console.log(`   Controls in scope: ${scope.filter(s => s.inScope).length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
