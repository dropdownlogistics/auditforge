// AuditForge — Audits API Route (updated for v0.4 UI)
// app/api/audits/route.js
import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

const VALID_TRANSITIONS = {
  PLANNING: ["FIELDWORK", "CANCELLED"],
  FIELDWORK: ["REPORTING", "CANCELLED"],
  REPORTING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const status = searchParams.get("status");
  const where = { companyId: resolved };
  if (status && status !== "ALL") where.status = status;

  const audits = await prisma.audit.findMany({
    where,
    include: {
      period: true,
      leadAuditor: true,
      team: {
        include: {
          auditor: { select: { auditorId: true, auditorName: true, role: true, certifications: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      controlScope: {
        where: { validTo: null },
        include: {
          control: {
            select: {
              controlId: true,
              description: true,
              controlType: true,
              keyControl: true,
              reviewStatus: true,
              process: { select: { processArea: true, processName: true } },
            },
          },
          assignedTo: { select: { auditorId: true, auditorName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ audits, count: audits.length });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, periodId, auditId, auditName, auditType, leadAuditorId, startDate, endDate, scope, methodology } = body;

    if (!companyId || !auditId || !auditName) {
      return NextResponse.json({ error: "companyId, auditId, and auditName are required" }, { status: 400 });
    }

    const resolved = await resolveCompanyId(companyId);
    if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    let resolvedPeriod = periodId;
    if (!resolvedPeriod) {
      const period = await prisma.period.findFirst({ where: { companyId: resolved }, orderBy: { periodStart: "desc" } });
      if (period) resolvedPeriod = period.id;
    }

    const existing = await prisma.audit.findUnique({ where: { auditId } });
    if (existing) return NextResponse.json({ error: `Audit ${auditId} already exists` }, { status: 409 });

    const audit = await prisma.audit.create({
      data: {
        auditId,
        companyId: resolved,
        periodId: resolvedPeriod,
        auditName,
        auditType: auditType || "INTERNAL",
        status: "PLANNING",
        leadAuditorId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scope,
        methodology,
      },
      include: { leadAuditor: true, period: true },
    });

    await prisma.auditTrail.create({
      data: {
        entityType: "Audit",
        entityId: audit.id,
        action: "CREATE",
        userId: body.userId || "system",
        newValues: JSON.parse(JSON.stringify(audit)),
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (e) {
    console.error("Create audit failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, cancelReason, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    if (status && status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json({
          error: `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`,
        }, { status: 400 });
      }
      if (status === "CANCELLED" && !cancelReason) {
        return NextResponse.json({ error: "cancelReason required when cancelling an audit" }, { status: 400 });
      }
      if (existing.status === "COMPLETED") {
        return NextResponse.json({ error: "COMPLETED audits are immutable" }, { status: 400 });
      }
    }

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        ...updates,
        ...(status ? { status } : {}),
        ...(cancelReason ? { cancelReason } : {}),
        version: { increment: 1 },
      },
      include: { leadAuditor: true, period: true },
    });

    await prisma.auditTrail.create({
      data: {
        entityType: "Audit",
        entityId: audit.id,
        action: status ? "TRANSITION" : "UPDATE",
        userId: body.userId || "system",
        previousValues: JSON.parse(JSON.stringify(existing)),
        newValues: JSON.parse(JSON.stringify(audit)),
        rationale: body.changeReason || (status ? `Status: ${existing.status} → ${status}` : null),
      },
    });

    return NextResponse.json(audit);
  } catch (e) {
    console.error("Update audit failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
