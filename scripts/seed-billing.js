const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const RATES = [
  { role: "PARTNER", hourlyRate: 285 },
  { role: "DIRECTOR", hourlyRate: 235 },
  { role: "MANAGER", hourlyRate: 195 },
  { role: "SENIOR", hourlyRate: 145 },
  { role: "STAFF", hourlyRate: 95 },
];

(async () => {
  const company = await p.company.findFirst({ select: { id: true, companyId: true } });
  if (!company) throw new Error("No company found");
  console.log(`Company: ${company.companyId} (${company.id})`);

  const effectiveDate = new Date("2025-01-01T00:00:00Z");
  for (const r of RATES) {
    await p.billingRate.upsert({
      where: { rateId: `RATE-${r.role}-2025` },
      update: { hourlyRate: r.hourlyRate, effectiveDate, companyId: company.id, rateType: "STANDARD", currency: "USD" },
      create: {
        rateId: `RATE-${r.role}-2025`,
        companyId: company.id,
        role: r.role,
        rateType: "STANDARD",
        hourlyRate: r.hourlyRate,
        effectiveDate,
        currency: "USD",
      },
    });
  }
  console.log(`Seeded ${RATES.length} billing rates`);

  const rateMap = Object.fromEntries(RATES.map((r) => [r.role, r.hourlyRate]));

  async function billForAudit(auditIdLabel) {
    const audit = await p.audit.findUnique({ where: { auditId: auditIdLabel }, select: { id: true } });
    if (!audit) throw new Error(`Audit ${auditIdLabel} not found`);
    const entries = await p.timeEntry.findMany({
      where: { engagementId: audit.id },
      include: { auditor: { select: { role: true } } },
    });
    let totalHours = 0;
    let totalDollars = 0;
    for (const e of entries) {
      const rate = rateMap[e.auditor.role] ?? 0;
      totalHours += e.hours;
      totalDollars += e.hours * rate;
    }
    const blended = totalHours > 0 ? totalDollars / totalHours : 0;
    return { auditInternalId: audit.id, totalHours, totalDollars, blended };
  }

  // AUD-2025-001 — COMPLETED, invoice SENT, AR PARTIAL @ 90%
  const b1 = await billForAudit("AUD-2025-001");
  console.log(`AUD-2025-001: hours=${b1.totalHours.toFixed(1)} · billed=$${b1.totalDollars.toFixed(2)} · blended=$${b1.blended.toFixed(2)}/hr`);

  const inv001 = await p.invoice.upsert({
    where: { invoiceId: "INV-2025-001" },
    update: {
      companyId: company.id,
      auditId: b1.auditInternalId,
      invoiceDate: new Date("2025-12-19T00:00:00Z"),
      dueDate: new Date("2026-01-18T00:00:00Z"),
      totalAmount: Math.round(b1.totalDollars * 100) / 100,
      billedHours: Math.round(b1.totalHours * 10) / 10,
      billingRate: Math.round(b1.blended * 100) / 100,
      currency: "USD",
      status: "SENT",
      notes: "Annual CAE Review — FY2025 Full Universe. Invoice issued at report date.",
    },
    create: {
      invoiceId: "INV-2025-001",
      companyId: company.id,
      auditId: b1.auditInternalId,
      invoiceDate: new Date("2025-12-19T00:00:00Z"),
      dueDate: new Date("2026-01-18T00:00:00Z"),
      totalAmount: Math.round(b1.totalDollars * 100) / 100,
      billedHours: Math.round(b1.totalHours * 10) / 10,
      billingRate: Math.round(b1.blended * 100) / 100,
      currency: "USD",
      status: "SENT",
      notes: "Annual CAE Review — FY2025 Full Universe. Invoice issued at report date.",
    },
  });
  const ar001Paid = Math.round(inv001.totalAmount * 0.9 * 100) / 100;
  await p.aREntry.upsert({
    where: { arId: "AR-INV-2025-001" },
    update: {
      companyId: company.id,
      invoiceId: inv001.id,
      paymentDate: new Date("2026-01-15T00:00:00Z"),
      amountPaid: ar001Paid,
      paymentMethod: "ACH",
      writeOffAmount: 0,
      status: "PARTIAL",
    },
    create: {
      arId: "AR-INV-2025-001",
      companyId: company.id,
      invoiceId: inv001.id,
      paymentDate: new Date("2026-01-15T00:00:00Z"),
      amountPaid: ar001Paid,
      paymentMethod: "ACH",
      writeOffAmount: 0,
      status: "PARTIAL",
    },
  });
  console.log(`INV-2025-001: $${inv001.totalAmount.toFixed(2)} SENT · AR $${ar001Paid.toFixed(2)} PARTIAL (90%)`);

  // AUD-2025-002 — REPORTING, invoice DRAFT, AR OUTSTANDING @ 0
  const b2 = await billForAudit("AUD-2025-002");
  console.log(`AUD-2025-002: hours=${b2.totalHours.toFixed(1)} · projected=$${b2.totalDollars.toFixed(2)} · blended=$${b2.blended.toFixed(2)}/hr`);

  const inv002 = await p.invoice.upsert({
    where: { invoiceId: "INV-2025-002" },
    update: {
      companyId: company.id,
      auditId: b2.auditInternalId,
      invoiceDate: new Date("2026-03-28T00:00:00Z"),
      dueDate: new Date("2026-04-27T00:00:00Z"),
      totalAmount: Math.round(b2.totalDollars * 100) / 100,
      billedHours: Math.round(b2.totalHours * 10) / 10,
      billingRate: Math.round(b2.blended * 100) / 100,
      currency: "USD",
      status: "DRAFT",
      notes: "Technology and Infrastructure Review — draft invoice, pending report issuance.",
    },
    create: {
      invoiceId: "INV-2025-002",
      companyId: company.id,
      auditId: b2.auditInternalId,
      invoiceDate: new Date("2026-03-28T00:00:00Z"),
      dueDate: new Date("2026-04-27T00:00:00Z"),
      totalAmount: Math.round(b2.totalDollars * 100) / 100,
      billedHours: Math.round(b2.totalHours * 10) / 10,
      billingRate: Math.round(b2.blended * 100) / 100,
      currency: "USD",
      status: "DRAFT",
      notes: "Technology and Infrastructure Review — draft invoice, pending report issuance.",
    },
  });
  await p.aREntry.upsert({
    where: { arId: "AR-INV-2025-002" },
    update: {
      companyId: company.id,
      invoiceId: inv002.id,
      paymentDate: null,
      amountPaid: 0,
      paymentMethod: null,
      writeOffAmount: 0,
      status: "OUTSTANDING",
    },
    create: {
      arId: "AR-INV-2025-002",
      companyId: company.id,
      invoiceId: inv002.id,
      paymentDate: null,
      amountPaid: 0,
      paymentMethod: null,
      writeOffAmount: 0,
      status: "OUTSTANDING",
    },
  });
  console.log(`INV-2025-002: $${inv002.totalAmount.toFixed(2)} DRAFT · AR $0 OUTSTANDING`);

  const invCount = await p.invoice.count();
  const arCount = await p.aREntry.count();
  const rateCount = await p.billingRate.count();
  console.log(`\n=== SEED COMPLETE ===`);
  console.log(`Rates: ${rateCount} · Invoices: ${invCount} · AR: ${arCount}`);

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FATAL:", e);
  await p.$disconnect();
  process.exit(1);
});
