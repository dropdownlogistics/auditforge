// AuditForge — Generate DDL RCM from live data
// Run: node generate-rcm.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const { generateRCM } = require("./src/lib/generators/rcm-generator");

const prisma = new PrismaClient();
const COMPANY_ID = "cmmozlolj001i5orssht3ulu4";
const PERIOD_ID = "cmmozlou3001k5ors7bn4p45e";

async function main() {
  console.log("Querying DDL control data from Neon...");

  const controls = await prisma.control.findMany({
    where: { companyId: COMPANY_ID, periodId: PERIOD_ID },
    include: {
      process: true,
      owner: true,
      period: true,
      company: true,
      risks: { where: { validTo: null }, include: { risk: true } },
      assertions: { where: { validTo: null }, include: { assertion: true } },
      frameworks: { where: { validTo: null }, include: { framework: true } },
    },
    orderBy: [
      { process: { processArea: "asc" } },
      { controlId: "asc" },
    ],
  });

  console.log(`Found ${controls.length} controls. Flattening for generator...`);

  const flat = controls.map((ctrl) => ({
    controlId: ctrl.controlId,
    controlDescription: ctrl.description,
    controlObjective: ctrl.objective,
    controlType: ctrl.controlType,
    controlNature: ctrl.controlNature,
    controlFrequency: ctrl.controlFrequency,
    keyControl: ctrl.keyControl,
    designEffectiveness: ctrl.designEffectiveness,
    operatingEffectiveness: ctrl.operatingEffectiveness,
    reviewStatus: ctrl.reviewStatus,
    version: ctrl.version,
    processArea: ctrl.process.processArea,
    processName: ctrl.process.processName,
    subprocessName: ctrl.process.subprocessName,
    ownerName: ctrl.owner?.ownerName || "Unassigned",
    ownerDepartment: ctrl.owner?.department || "",
    periodLabel: ctrl.period.periodLabel,
    companyName: ctrl.company.name,
    riskId: ctrl.risks[0]?.risk.riskId || "N/A",
    riskDescription: ctrl.risks[0]?.risk.description || "No risk mapped",
    inherentRiskRating: ctrl.risks[0]?.risk.inherentRiskRating || "MEDIUM",
    riskIds: ctrl.risks.map((cr) => cr.risk.riskId),
    assertions: ctrl.assertions.map((ca) => ca.assertion.assertionName),
    frameworkRefs: ctrl.frameworks.map((cf) => cf.framework.requirementId),
  }));

  const outputDir = path.join(__dirname, "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("Generating RCM XLSX...");
  const result = await generateRCM({
    companyName: "Dropdown Logistics",
    periodLabel: "FY2025",
    controls: flat,
    outputDir,
  });

  console.log(`\n✅ RCM GENERATED`);
  console.log(`   File: ${result.fileName}`);
  console.log(`   Path: ${result.filePath}`);
  console.log(`   Controls: ${flat.length}`);
  console.log(`   Process Areas: ${[...new Set(flat.map(c => c.processArea))].join(", ")}`);
  console.log(`\nOpen the file: start "" "${result.filePath}"`);
}

main()
  .catch((e) => { console.error("Generation failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
