// AuditForge v0.4 — Seed: DDL Auditor + First Audit Engagement
// Run: node prisma/seed-v04.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding v0.4 — Audit Engagement Layer...");

  // Get company + period
  const company = await prisma.company.findUnique({ where: { companyId: "CO-DDL" } });
  if (!company) throw new Error("Company CO-DDL not found. Run base seed first.");
  const period = await prisma.period.findFirst({ where: { companyId: company.id } });

  // ── Dim_Auditor ──
  const auditor = await prisma.auditor.upsert({
    where: { auditorId: "AUD-DK-001" },
    update: {},
    create: {
      auditorId: "AUD-DK-001",
      companyId: company.id,
      auditorName: "Dave Kitchens",
      title: "Chief Standards Officer",
      department: "Governance",
      email: null,
      certifications: "CPA",
      independence: "INTERNAL",
      firm: "Dropdown Logistics",
      isActive: true,
    },
  });
  console.log(`Seeded auditor: ${auditor.auditorName} (${auditor.auditorId})`);

  // ── Fact_Audit ──
  const audit = await prisma.audit.upsert({
    where: { auditId: "AUD-2025-001" },
    update: {},
    create: {
      auditId: "AUD-2025-001",
      companyId: company.id,
      periodId: period.id,
      auditName: "DDL CAE Annual Review — FY2025",
      auditType: "INTERNAL",
      status: "PLANNING",
      leadAuditorId: auditor.id,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-12-31"),
      scope: "Annual review of all DDL Control Audit Engine controls across Governance & Oversight, Prompt Governance, Context Integrity, and Human-AI Boundary domains. Full design and operating effectiveness testing of all 11 controls.",
      methodology: "Design effectiveness: inquiry and inspection of governing documentation. Operating effectiveness: inspection of evidence and reperformance of control activities. Sample-based testing for recurring controls; full-population for ad hoc controls.",
    },
  });
  console.log(`Seeded audit: ${audit.auditName} (${audit.auditId})`);

  // ── Bridge_Audit_Control (all 11 controls in scope) ──
  const controls = await prisma.control.findMany({
    where: { companyId: company.id, periodId: period.id },
    orderBy: { controlId: "asc" },
  });

  let scopeCount = 0;
  for (const ctrl of controls) {
    // Check if already exists
    const existing = await prisma.auditControlScope.findFirst({
      where: { auditId: audit.id, controlId: ctrl.id, validTo: null },
    });
    if (!existing) {
      await prisma.auditControlScope.create({
        data: {
          auditId: audit.id,
          controlId: ctrl.id,
          inScope: true,
          scopeDecision: "IN_SCOPE",
          scopeRationale: "All DDL CAE controls included in annual review scope.",
          assignedToId: auditor.id,
          targetDate: new Date("2025-06-30"),
        },
      });
      scopeCount++;
    }
  }
  console.log(`Scoped ${scopeCount} controls to ${audit.auditId}`);

  console.log("\n=== v0.4 SEED COMPLETE ===");
  console.log(`Auditor:  ${auditor.auditorId} (${auditor.auditorName}, ${auditor.certifications})`);
  console.log(`Audit:    ${audit.auditId} (${audit.auditName})`);
  console.log(`Status:   ${audit.status}`);
  console.log(`Scope:    ${controls.length} controls in scope`);
  console.log(`Assigned: All to ${auditor.auditorId}`);
}

main()
  .catch((e) => { console.error("v0.4 seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
