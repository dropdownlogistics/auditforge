// AuditForge — Risks API Route
// Updated for CR-WB-RISK-001 maturation split.
// Reads from dim_risk + latest Fact_RiskAssessment + latest Fact_RiskStatusChange.

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const where = { companyId: resolved, isCurrentVersion: true };
  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { riskId: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const risks = await prisma.risk.findMany({
    where,
    include: {
      riskCategory: { select: { categoryName: true } },
      assessments: {
        orderBy: { assessmentDate: "desc" },
        take: 1,
        include: {
          likelihood: { select: { level: true, rank: true, label: true } },
          impact: { select: { level: true, rank: true, label: true } },
          severity: { select: { level: true, rank: true, label: true } },
        },
      },
      statusChanges: {
        orderBy: { effectiveDate: "desc" },
        take: 1,
        select: { toStatus: true, effectiveDate: true },
      },
      bridgeControls: {
        where: { effectiveTo: null },
        select: { controlId: true, mitigationType: true },
      },
    },
    orderBy: [{ riskId: "asc" }],
  });

  const enriched = risks.map((r) => {
    const latestAssessment = r.assessments[0] || null;
    const latestStatus = r.statusChanges[0] || null;
    return {
      ...r,
      currentAssessment: latestAssessment,
      currentStatus: latestStatus?.toStatus || "UNKNOWN",
      controlCount: r.bridgeControls.length,
      hasGap: r.bridgeControls.length === 0,
    };
  });

  return NextResponse.json({ risks: enriched, count: enriched.length });
}

// POST/PUT/DELETE temporarily stubbed — maturation split requires
// new creation flow through Fact_RiskAssessment + Fact_RiskStatusChange.
// Full CRUD update deferred to V2.

export async function POST() {
  return NextResponse.json(
    { error: "Risk creation via API temporarily disabled during CR-WB-RISK-001 migration. Use AuditForge UI." },
    { status: 503 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Risk update via API temporarily disabled during CR-WB-RISK-001 migration. Assessment and status changes require new fact-stream endpoints." },
    { status: 503 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Risk deletion via API temporarily disabled during CR-WB-RISK-001 migration." },
    { status: 503 },
  );
}
