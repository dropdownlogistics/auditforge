// Generate DDL Walkthrough Narratives from live data
// Run: node generate-walkthroughs.js
// Generates one DOCX per process area

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const { generateWalkthrough } = require("./src/lib/generators/walkthrough-generator");

const prisma = new PrismaClient();

async function main() {
  console.log("Querying DDL process and control data...");
  const company = await prisma.company.findUnique({ where: { companyId: "CO-DDL" } });
  const period = await prisma.period.findFirst({ where: { companyId: company.id } });

  const processes = await prisma.process.findMany({
    where: { companyId: company.id },
    orderBy: { processArea: "asc" },
  });

  const outputDir = path.join(__dirname, "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Group processes by area and generate one walkthrough per unique area
  const areas = [...new Set(processes.map((p) => p.processArea))];

  for (const area of areas) {
    const areaProcesses = processes.filter((p) => p.processArea === area);
    const primaryProcess = areaProcesses[0];

    // Get controls for this area
    const controls = await prisma.control.findMany({
      where: { companyId: company.id, periodId: period.id, processId: { in: areaProcesses.map((p) => p.id) } },
      include: {
        process: true,
        owner: true,
        risks: { where: { validTo: null }, include: { risk: true } },
        assertions: { where: { validTo: null }, include: { assertion: true } },
        frameworks: { where: { validTo: null }, include: { framework: true } },
      },
      orderBy: { controlId: "asc" },
    });

    if (controls.length === 0) continue;

    // Flatten controls
    const flat = controls.map((c) => ({
      controlId: c.controlId,
      description: c.description,
      controlDescription: c.description,
      controlType: c.controlType,
      controlNature: c.controlNature,
      controlFrequency: c.controlFrequency,
      keyControl: c.keyControl,
      designEffectiveness: c.designEffectiveness,
      operatingEffectiveness: c.operatingEffectiveness,
      ownerName: c.owner?.ownerName || "Unassigned",
      evidenceDescription: c.evidenceDescription,
      riskIds: c.risks.map((cr) => cr.risk.riskId),
      assertions: c.assertions.map((ca) => ca.assertion.assertionName),
      frameworkRefs: c.frameworks.map((cf) => cf.framework.requirementId),
    }));

    // Collect risks
    const riskIds = [...new Set(flat.flatMap((c) => c.riskIds))];
    const risks = await prisma.risk.findMany({
      where: { companyId: company.id, riskId: { in: riskIds } },
    });

    console.log(`Generating walkthrough: ${area} (${flat.length} controls, ${risks.length} risks)...`);

    const result = await generateWalkthrough({
      companyName: "Dropdown Logistics",
      periodLabel: "FY2025",
      process: primaryProcess,
      controls: flat,
      risks,
      preparedBy: "Dave Kitchens, CPA",
      outputDir,
    });

    console.log(`  \u2705 ${result.fileName}`);
  }

  console.log(`\nAll walkthroughs generated in: ${outputDir}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
