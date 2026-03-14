// AuditForge — v0.3 Seed Additions (DDL)
// Run AFTER seed.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding v0.3 additions for DDL...");

  const typeProfiles = [
    { nature: "PREVENTIVE", automation: "MANUAL",        domain: "BUSINESS", label: "Preventive Manual Business" },
    { nature: "PREVENTIVE", automation: "AUTOMATED",     domain: "IT",       label: "Preventive Automated IT" },
    { nature: "PREVENTIVE", automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Preventive IT-Dependent Hybrid" },
    { nature: "DETECTIVE",  automation: "MANUAL",        domain: "BUSINESS", label: "Detective Manual Business" },
    { nature: "DETECTIVE",  automation: "AUTOMATED",     domain: "IT",       label: "Detective Automated IT" },
    { nature: "DETECTIVE",  automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Detective IT-Dependent Hybrid" },
    { nature: "CORRECTIVE", automation: "MANUAL",        domain: "BUSINESS", label: "Corrective Manual Business" },
    { nature: "CORRECTIVE", automation: "AUTOMATED",     domain: "IT",       label: "Corrective Automated IT" },
    { nature: "CORRECTIVE", automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Corrective IT-Dependent Hybrid" },
  ];

  let typeCount = 0;
  for (const profile of typeProfiles) {
    await prisma.controlTypeDim.upsert({
      where: { label: profile.label },
      update: {},
      create: profile,
    });
    typeCount++;
  }
  console.log(`Seeded ${typeCount} control type profiles`);

  // All DDL CAE controls are manual business controls (human-operated governance)
  // except context isolation which could be argued as hybrid
  const typeMap = {
    "CTRL-GOV-001": "Detective Manual Business",
    "CTRL-PRO-001": "Preventive Manual Business",
    "CTRL-PRO-002": "Preventive Manual Business",
    "CTRL-PRO-003": "Detective Manual Business",
    "CTRL-PRO-004": "Preventive Manual Business",
    "CTRL-CTX-001": "Detective Manual Business",
    "CTRL-CTX-002": "Preventive Manual Business",
    "CTRL-CTX-003": "Preventive Manual Business",
    "CTRL-HAB-001": "Preventive Manual Business",
    "CTRL-HAB-002": "Detective Manual Business",
    "CTRL-HAB-003": "Preventive Manual Business",
  };

  const company = await prisma.company.findUnique({ where: { companyId: "CO-DDL" } });
  if (company) {
    for (const [controlId, typeLabel] of Object.entries(typeMap)) {
      const typeDim = await prisma.controlTypeDim.findUnique({ where: { label: typeLabel } });
      if (typeDim) {
        await prisma.control.updateMany({
          where: { companyId: company.id, controlId },
          data: { controlTypeDimId: typeDim.id },
        });
      }
    }
    console.log("Wired DDL controls to ControlTypeDim");

    await prisma.control.updateMany({
      where: { companyId: company.id },
      data: { lifecycle: "ACTIVE" },
    });
    console.log("Set DDL controls to ACTIVE lifecycle");
  }

  console.log("v0.3 seed complete for DDL.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
