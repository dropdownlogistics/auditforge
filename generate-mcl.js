// Generate DDL Master Control List from live data
// Run: node generate-mcl.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const { generateMCL } = require("./src/lib/generators/mcl-generator");

const prisma = new PrismaClient();

async function main() {
  console.log("Querying DDL control data...");
  const company = await prisma.company.findUnique({ where: { companyId: "CO-DDL" } });
  const period = await prisma.period.findFirst({ where: { companyId: company.id } });

  const controls = await prisma.control.findMany({
    where: { companyId: company.id, periodId: period.id },
    include: { process: true, owner: true },
    orderBy: { controlId: "asc" },
  });

  const flat = controls.map((c) => ({
    controlId: c.controlId,
    controlDescription: c.description,
    controlObjective: c.objective,
    controlType: c.controlType,
    controlNature: c.controlNature,
    controlFrequency: c.controlFrequency,
    keyControl: c.keyControl,
    designEffectiveness: c.designEffectiveness,
    operatingEffectiveness: c.operatingEffectiveness,
    reviewStatus: c.reviewStatus,
    processArea: c.process.processArea,
    processName: c.process.processName,
    ownerName: c.owner?.ownerName || "Unassigned",
    ownerDepartment: c.owner?.department || "",
    version: c.version,
  }));

  const outputDir = path.join(__dirname, "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("Generating MCL XLSX...");
  const result = await generateMCL({
    companyName: "Dropdown Logistics",
    periodLabel: "FY2025",
    controls: flat,
    outputDir,
  });

  console.log(`\n\u2705 MCL GENERATED`);
  console.log(`   File: ${result.fileName}`);
  console.log(`   Path: ${result.filePath}`);
  console.log(`   Controls: ${flat.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
