import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const [rates, invoices, team, timeEntries] = await Promise.all([
    prisma.billingRate.findMany({ where: { companyId: resolved } }),
    prisma.invoice.findMany({
      where: { companyId: resolved },
      include: {
        audit: { select: { auditId: true, auditName: true, status: true } },
        arEntries: true,
      },
    }),
    prisma.auditAuditor.findMany({
      where: { audit: { companyId: resolved } },
      include: {
        audit: { select: { auditId: true } },
        auditor: { select: { role: true, auditorName: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: { engagement: { companyId: resolved } },
      include: {
        engagement: { select: { auditId: true, auditName: true, status: true } },
        auditor: { select: { auditorName: true, role: true } },
      },
    }),
  ]);

  const rateMap = Object.fromEntries(rates.map((r) => [r.role, r.hourlyRate]));

  const totalBilled = invoices
    .filter((i) => i.status !== "DRAFT")
    .reduce((s, i) => s + i.totalAmount, 0);
  const draftBilled = invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = invoices
    .flatMap((i) => i.arEntries)
    .reduce((s, ar) => s + (ar.amountPaid || 0), 0);
  const totalWriteOff = invoices
    .flatMap((i) => i.arEntries)
    .reduce((s, ar) => s + (ar.writeOffAmount || 0), 0);
  const outstandingAR = totalBilled - totalCollected - totalWriteOff;

  // Dollar budget per audit = sum(AuditAuditor.budgetHours × rate for teamRole)
  const budgetByAudit = {};
  for (const t of team) {
    const rate = rateMap[t.teamRole] ?? 0;
    const dollars = (t.budgetHours || 0) * rate;
    const k = t.audit.auditId;
    budgetByAudit[k] = (budgetByAudit[k] || 0) + dollars;
  }
  const totalBudget = Object.values(budgetByAudit).reduce((s, v) => s + v, 0);

  // Revenue by engagement (billed + collected per audit)
  const byEngagement = {};
  for (const inv of invoices) {
    const k = inv.audit.auditId;
    if (!byEngagement[k]) {
      byEngagement[k] = {
        auditId: k,
        auditName: inv.audit.auditName,
        status: inv.audit.status,
        budget: budgetByAudit[k] || 0,
        billed: 0,
        collected: 0,
        invoiceStatus: inv.status,
      };
    }
    byEngagement[k].billed += inv.totalAmount;
    byEngagement[k].collected += inv.arEntries.reduce((s, ar) => s + ar.amountPaid, 0);
  }
  // Include engagements with budget but no invoice yet
  for (const [auditId, budget] of Object.entries(budgetByAudit)) {
    if (!byEngagement[auditId]) {
      byEngagement[auditId] = { auditId, auditName: null, status: null, budget, billed: 0, collected: 0, invoiceStatus: null };
    }
  }
  const revenueByEngagement = Object.values(byEngagement)
    .map((e) => ({
      ...e,
      realization: e.budget > 0 ? e.billed / e.budget : 0,
    }))
    .sort((a, b) => b.billed - a.billed);

  // Revenue by auditor (actual time × role rate)
  const byAuditor = {};
  for (const te of timeEntries) {
    const rate = rateMap[te.auditor.role] ?? 0;
    const k = te.auditorId;
    if (!byAuditor[k]) {
      byAuditor[k] = { auditorId: k, auditorName: te.auditor.auditorName, role: te.auditor.role, hours: 0, rate, revenue: 0 };
    }
    byAuditor[k].hours += te.hours;
    byAuditor[k].revenue += te.hours * rate;
  }
  const revenueByAuditor = Object.values(byAuditor).sort((a, b) => b.revenue - a.revenue);

  // AR aging vs today (dueDate based)
  const today = new Date();
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const inv of invoices) {
    if (inv.status === "DRAFT") continue;
    const outstanding = inv.totalAmount - inv.arEntries.reduce((s, ar) => s + ar.amountPaid + ar.writeOffAmount, 0);
    if (outstanding <= 0.01) continue;
    const daysPast = Math.floor((today - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
    if (daysPast <= 0) buckets.current += outstanding;
    else if (daysPast <= 30) buckets.d30 += outstanding;
    else if (daysPast <= 60) buckets.d60 += outstanding;
    else buckets.d90 += outstanding;
  }

  const realizationRate = totalBudget > 0 ? totalBilled / totalBudget : 0;
  const collectionRate = totalBilled > 0 ? totalCollected / totalBilled : 0;

  return NextResponse.json({
    kpi: {
      totalBilled,
      draftBilled,
      totalCollected,
      outstandingAR,
      totalWriteOff,
      totalBudget,
      realizationRate,
      collectionRate,
    },
    revenueByEngagement,
    revenueByAuditor,
    arAging: buckets,
    rateCard: rates,
  });
}
