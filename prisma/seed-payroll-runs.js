// AuditForge — Seed Payroll Runs (Phase C)
// Synthetic pay run data for demo. Mulberry32 seed=20260415.
// Run: node prisma/seed-payroll-runs.js

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const rng = mulberry32(20260415);

  // Resolve company
  const company = await prisma.company.findFirst({ where: { companyId: "CO-DDL" } });
  if (!company) throw new Error("Company CO-DDL not found");

  // Get current comp data for gross/net calculation
  const compChanges = await prisma.compChange.findMany({
    where: { employee: { companyId: company.id, isActive: true } },
    orderBy: { effectiveDate: "desc" },
    distinct: ["employeeId"],
  });

  // Calculate total annual comp
  const totalAnnual = compChanges.reduce((sum, c) => {
    const rate = Number(c.newRate);
    return sum + (c.payCadence === "ANNUAL" ? rate : rate * 2080);
  }, 0);

  // Biweekly gross = annual / 26
  const biweeklyGross = Math.round(totalAnnual / 26 * 100) / 100;
  // Net ≈ 72-78% of gross (taxes + benefits)
  const netPct = () => 0.72 + rng() * 0.06;

  // 3 pay runs: two completed, one pending
  const runs = [
    {
      periodStart: new Date("2026-03-03"),
      periodEnd: new Date("2026-03-14"),
      runDate: new Date("2026-03-14"),
      runType: "REGULAR_BIWEEKLY [SYNTHETIC]",
      totalGross: biweeklyGross,
      totalNet: Math.round(biweeklyGross * netPct() * 100) / 100,
      status: "COMPLETED",
    },
    {
      periodStart: new Date("2026-03-17"),
      periodEnd: new Date("2026-03-28"),
      runDate: new Date("2026-03-28"),
      runType: "REGULAR_BIWEEKLY [SYNTHETIC]",
      totalGross: biweeklyGross,
      totalNet: Math.round(biweeklyGross * netPct() * 100) / 100,
      status: "COMPLETED",
    },
    {
      periodStart: new Date("2026-03-31"),
      periodEnd: new Date("2026-04-11"),
      runDate: new Date("2026-04-11"),
      runType: "REGULAR_BIWEEKLY [SYNTHETIC]",
      totalGross: biweeklyGross,
      totalNet: Math.round(biweeklyGross * netPct() * 100) / 100,
      status: "PENDING",
    },
  ];

  let created = 0;
  for (const run of runs) {
    // Idempotent: skip if a run for this period already exists
    const existing = await prisma.payrollRun.findFirst({
      where: {
        companyId: company.id,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
      },
    });
    if (existing) {
      console.log(`  Skip: pay run ${run.periodStart.toISOString().slice(0, 10)} → ${run.periodEnd.toISOString().slice(0, 10)} already exists`);
      continue;
    }

    await prisma.payrollRun.create({
      data: {
        companyId: company.id,
        ...run,
      },
    });
    created++;
    console.log(`  Created: ${run.runType} ${run.periodStart.toISOString().slice(0, 10)} → ${run.periodEnd.toISOString().slice(0, 10)} | gross=$${run.totalGross.toLocaleString()} net=$${run.totalNet.toLocaleString()} | ${run.status}`);
  }

  console.log(`\nPayroll seed complete: ${created} runs created, ${runs.length - created} skipped (idempotent).`);
  console.log("All runs flagged [SYNTHETIC] in runType.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
