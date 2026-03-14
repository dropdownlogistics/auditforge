// AuditForge — Risks API Route
// app/api/risks/route.js

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";
import { validateRisk, createAuditEntry, computeDiffs, TRACKED_FIELDS } from "@/lib/middleware/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const where = { companyId: resolved };
  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { riskId: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  const category = searchParams.get("category");
  if (category && category !== "ALL") where.category = category;

  const risks = await prisma.risk.findMany({
    where,
    include: {
      controls: {
        where: { validTo: null },
        include: { control: { select: { controlId: true, controlType: true, keyControl: true, lifecycle: true } } },
      },
    },
    orderBy: [{ category: "asc" }, { riskId: "asc" }],
  });

  // Enrich with coverage info
  const enriched = risks.map((r) => ({
    ...r,
    controlCount: r.controls.filter((cr) => cr.control.lifecycle === "ACTIVE").length,
    hasGap: r.controls.filter((cr) => cr.control.lifecycle === "ACTIVE").length === 0,
  }));

  return NextResponse.json({ risks: enriched, count: enriched.length });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = "system", ...data } = body;

    const errors = validateRisk(data);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

    const existing = await prisma.risk.findFirst({
      where: { companyId: data.companyId, riskId: data.riskId },
    });
    if (existing) {
      return NextResponse.json({ errors: [{ field: "riskId", message: `Risk ${data.riskId} already exists` }] }, { status: 409 });
    }

    const risk = await prisma.risk.create({
      data: {
        riskId: data.riskId,
        companyId: data.companyId,
        description: data.description,
        category: data.category,
        likelihood: data.likelihood || "MEDIUM",
        impact: data.impact || "MEDIUM",
        inherentRiskRating: data.inherentRiskRating || "MEDIUM",
        residualRiskRating: data.residualRiskRating || null,
        riskResponse: data.riskResponse || null,
      },
    });

    await createAuditEntry(prisma, { entityType: "Risk", entityId: risk.id, action: "CREATE", userId, rationale: "Initial creation" });

    return NextResponse.json({ risk }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, userId = "system", changeReason, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Risk id required" }, { status: 400 });
    if (!changeReason) return NextResponse.json({ errors: [{ field: "changeReason", message: "Change reason required" }] }, { status: 422 });

    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Risk not found" }, { status: 404 });

    const diffs = computeDiffs(existing, updates, TRACKED_FIELDS.Risk);
    const risk = await prisma.risk.update({ where: { id }, data: updates });

    for (const diff of diffs) {
      await createAuditEntry(prisma, { entityType: "Risk", entityId: id, action: "EDIT", field: diff.field, previousValue: diff.previousValue, newValue: diff.newValue, userId, rationale: changeReason });
    }

    return NextResponse.json({ risk });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId") || "system";
  if (!id) return NextResponse.json({ error: "Risk id required" }, { status: 400 });

  const existing = await prisma.risk.findUnique({ where: { id }, include: { controls: { where: { validTo: null } } } });
  if (!existing) return NextResponse.json({ error: "Risk not found" }, { status: 404 });
  if (existing.controls.length > 0) {
    return NextResponse.json({ error: "Cannot delete risk with active control mappings. Remove mappings first." }, { status: 409 });
  }

  await createAuditEntry(prisma, { entityType: "Risk", entityId: id, action: "DELETE", userId, rationale: "Deleted by user" });
  await prisma.risk.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
