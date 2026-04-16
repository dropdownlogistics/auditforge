import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveAudit(idOrLabel) {
  let audit = await prisma.audit.findUnique({ where: { auditId: idOrLabel } });
  if (audit) return audit;
  audit = await prisma.audit.findUnique({ where: { id: idOrLabel } }).catch(() => null);
  return audit;
}

export async function GET(_request, context) {
  const params = await context.params;
  const audit = await resolveAudit(params.id);
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const companyId = audit.companyId;

  const [timeEntries, team, scope, invoices, rates] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { engagementId: audit.id },
      include: { auditor: { select: { role: true } } },
    }),
    prisma.auditAuditor.findMany({
      where: { auditId: audit.id },
      include: { auditor: { include: { tokenAssessments: { include: { token: { select: { code: true, polarity: true } } } } } } },
    }),
    prisma.auditControlScope.findMany({
      where: { auditId: audit.id },
      include: {
        control: {
          select: {
            id: true,
            reviewStatus: true,
            designEffectiveness: true,
            operatingEffectiveness: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { auditId: audit.id },
      include: { arEntries: true },
    }),
    prisma.billingRate.findMany({ where: { companyId } }),
  ]);

  const rateMap = Object.fromEntries(rates.map((r) => [r.role, r.hourlyRate]));

  // HOURS
  const budgetHours = team.reduce((s, t) => s + (t.budgetHours || 0), 0);
  const actualHours = timeEntries.reduce((s, te) => s + te.hours, 0);
  const utilization = budgetHours > 0 ? actualHours / budgetHours : 0;

  // CONTROLS
  const inScope = scope.filter((s) => s.inScope && s.control);
  const approved = inScope.filter((s) => s.control.reviewStatus === "APPROVED").length;
  const coverage = inScope.length > 0 ? approved / inScope.length : 0;
  const effectiveCount = inScope.filter(
    (s) => s.control.designEffectiveness === "EFFECTIVE" && s.control.operatingEffectiveness === "EFFECTIVE"
  ).length;
  const effectivenessRate = inScope.length > 0 ? effectiveCount / inScope.length : 0;

  // BILLING
  const dollarBudget = team.reduce((s, t) => s + (t.budgetHours || 0) * (rateMap[t.teamRole] || 0), 0);
  const billed = invoices.filter((i) => i.status !== "DRAFT").reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoices.flatMap((i) => i.arEntries).reduce((s, ar) => s + (ar.amountPaid || 0), 0);
  const realization = dollarBudget > 0 ? billed / dollarBudget : 0;

  // TEAM
  const headcount = team.length;
  const allTokens = new Set();
  for (const t of team) {
    if (t.auditor?.tokenAssessments) {
      for (const ta of t.auditor.tokenAssessments) {
        if (ta.token?.polarity === "STRENGTH") allTokens.add(ta.token.code);
      }
    }
  }
  const tokenCoverage = allTokens.size;

  // TIMELINE
  const today = new Date();
  const end = audit.endDate ? new Date(audit.endDate) : null;
  const daysRemaining = end ? Math.floor((end - today) / (1000 * 60 * 60 * 24)) : null;

  // SCORE — 25 pts each
  const hoursPts = (() => {
    if (budgetHours === 0) return 0;
    const diff = Math.abs(1 - utilization);
    if (diff <= 0.1) return 25;
    if (diff <= 0.25) return 18;
    if (diff <= 0.5) return 10;
    return 4;
  })();
  const controlsPts = Math.round(coverage * 25);
  const billingPts = (() => {
    if (audit.status === "PLANNING") return 25;
    if (dollarBudget === 0) return 0;
    if (realization >= 0.85 && realization <= 1.15) return 25;
    if (realization >= 0.7 && realization <= 1.3) return 18;
    if (realization >= 0.5) return 10;
    return 4;
  })();
  const timelinePts = (() => {
    if (!end) return 0;
    if (audit.status === "COMPLETED") return 25;
    if (daysRemaining == null) return 0;
    if (daysRemaining > 14) return 25;
    if (daysRemaining > 0) return 18;
    if (daysRemaining > -14) return 10;
    return 4;
  })();
  const score = hoursPts + controlsPts + billingPts + timelinePts;

  return NextResponse.json({
    auditId: audit.auditId,
    status: audit.status,
    score,
    components: {
      hours: {
        budgetHours,
        actualHours: Math.round(actualHours * 10) / 10,
        utilization,
        points: hoursPts,
      },
      controls: {
        inScope: inScope.length,
        approved,
        coverage,
        effectivenessRate,
        points: controlsPts,
      },
      billing: {
        dollarBudget,
        billed,
        collected,
        realization,
        points: billingPts,
      },
      team: {
        headcount,
        tokenCoverage,
        points: 0,
      },
      timeline: {
        startDate: audit.startDate,
        endDate: audit.endDate,
        daysRemaining,
        points: timelinePts,
      },
    },
  });
}
