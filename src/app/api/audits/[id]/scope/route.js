// AuditForge — Audit Scope Management API
// app/api/audits/[id]/scope/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = await params;

  // Find audit by internal ID or natural ID
  let audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const scope = await prisma.auditControlScope.findMany({
    where: { auditId: audit.id, validTo: null },
    include: {
      control: {
        include: {
          process: true,
          owner: true,
          risks: { where: { validTo: null }, include: { risk: true } },
        },
      },
      assignedTo: true,
    },
    orderBy: { control: { controlId: "asc" } },
  });

  const summary = {
    auditId: audit.auditId,
    auditName: audit.auditName,
    totalInScope: scope.filter((s) => s.inScope).length,
    totalOutOfScope: scope.filter((s) => !s.inScope).length,
    totalDeferred: scope.filter((s) => s.scopeDecision === "DEFERRED").length,
  };

  return NextResponse.json({ scope, summary });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  let audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  if (audit.status === "COMPLETED" || audit.status === "CANCELLED") {
    return NextResponse.json({ error: `Cannot modify scope of ${audit.status} audit` }, { status: 400 });
  }

  const { controlIds, assignedToId, targetDate, scopeDecision, scopeRationale } = body;

  if (!controlIds || !Array.isArray(controlIds) || controlIds.length === 0) {
    return NextResponse.json({ error: "controlIds array required" }, { status: 400 });
  }

  // Resolve control natural IDs to internal IDs
  const controls = await prisma.control.findMany({
    where: {
      OR: [
        { id: { in: controlIds } },
        { controlId: { in: controlIds } },
      ],
    },
  });

  if (controls.length === 0) {
    return NextResponse.json({ error: "No matching controls found" }, { status: 404 });
  }

  const results = [];
  for (const ctrl of controls) {
    // Close any existing scope record
    await prisma.auditControlScope.updateMany({
      where: { auditId: audit.id, controlId: ctrl.id, validTo: null },
      data: { validTo: new Date() },
    });

    // Create new scope record
    const scope = await prisma.auditControlScope.create({
      data: {
        auditId: audit.id,
        controlId: ctrl.id,
        inScope: scopeDecision !== "OUT_OF_SCOPE",
        scopeDecision: scopeDecision || "IN_SCOPE",
        scopeRationale: scopeRationale || null,
        assignedToId: assignedToId || null,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    });
    results.push(scope);
  }

  // Audit trail
  await prisma.auditTrail.create({
    data: {
      entityType: "AuditControlScope",
      entityId: audit.id,
      action: "SCOPE_CHANGE",
      userId: body.userId || "system",
      newValues: { controlIds: controls.map((c) => c.controlId), scopeDecision: scopeDecision || "IN_SCOPE" },
      rationale: scopeRationale || `Scope update: ${controls.length} controls`,
    },
  });

  return NextResponse.json({ updated: results.length, scope: results }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  let audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  if (audit.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot modify scope of COMPLETED audit" }, { status: 400 });
  }

  const { controlIds, rationale } = body;
  if (!controlIds || !rationale) {
    return NextResponse.json({ error: "controlIds and rationale required" }, { status: 400 });
  }

  const controls = await prisma.control.findMany({
    where: {
      OR: [
        { id: { in: controlIds } },
        { controlId: { in: controlIds } },
      ],
    },
  });

  const closed = await prisma.auditControlScope.updateMany({
    where: {
      auditId: audit.id,
      controlId: { in: controls.map((c) => c.id) },
      validTo: null,
    },
    data: { validTo: new Date(), scopeDecision: "OUT_OF_SCOPE", scopeRationale: rationale },
  });

  await prisma.auditTrail.create({
    data: {
      entityType: "AuditControlScope",
      entityId: audit.id,
      action: "SCOPE_REMOVAL",
      userId: body.userId || "system",
      newValues: { controlIds: controls.map((c) => c.controlId), removed: true },
      rationale,
    },
  });

  return NextResponse.json({ removed: closed.count });
}
