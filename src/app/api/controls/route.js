import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";
import {
  validateControl,
  validateControlReadiness,
  validateReviewTransition,
  validateLifecycleTransition,
  createAuditEntry,
  createStatusLogEntry,
  computeDiffs,
  TRACKED_FIELDS,
} from "@/lib/middleware/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

   const where = { companyId: resolved };
  const periodId = searchParams.get("periodId");
  if (periodId) where.periodId = periodId;

  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { controlId: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const type = searchParams.get("type");
  if (type && type !== "ALL") where.controlTypeDim = { nature: type };

  const status = searchParams.get("status");
  if (status && status !== "ALL") where.reviewStatus = status;

  const lifecycle = searchParams.get("lifecycle");
  if (lifecycle && lifecycle !== "ALL") where.lifecycle = lifecycle;

  const controls = await prisma.control.findMany({
    where,
    include: {
      process: true,
      period: true,
      scope: true,
      controlTypeDim: { select: { nature: true, automation: true, domain: true, label: true } },
      risks: {
        where: { validTo: null },
        include: { risk: true },
      },
      controlObjectives: {
        where: { validTo: null },
        include: { controlObjective: true },
      },
      frameworks: {
        where: { validTo: null },
        include: { framework: true },
      },
    },
    orderBy: [
      { process: { processArea: "asc" } },
      { controlId: "asc" },
    ],
  });

  return NextResponse.json({ controls, count: controls.length });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = "system", ...data } = body;

    const errors = validateControl(data, "create");
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const existing = await prisma.control.findFirst({
      where: {
        companyId: data.companyId,
        controlId: data.controlId,
        periodId: data.periodId,
        version: 1,
      },
    });
    if (existing) {
      return NextResponse.json({
        errors: [{ field: "controlId", message: `Control ${data.controlId} already exists for this period` }],
      }, { status: 409 });
    }

    const control = await prisma.control.create({
      data: {
        controlId: data.controlId,
        companyId: data.companyId,
        processId: data.processId,
        periodId: data.periodId,
        scopeId: data.scopeId || null,
        controlTypeId: data.controlTypeId || data.controlTypeDimId || null,
        ownerEmployeeId: data.ownerEmployeeId || null,
        ownerRoleId: data.ownerRoleId || null,
        description: data.description,
        objective: data.objective || null,
        controlNature: data.controlNature || "MANUAL",
        controlFrequency: data.controlFrequency || "MONTHLY",
        keyControl: data.keyControl || false,
        evidenceDescription: data.evidenceDescription || null,
        testProcedure: data.testProcedure || null,
        lifecycle: "DRAFT",
        reviewStatus: "DRAFT",
        version: 1,
      },
      include: {
        process: true,
      },
    });

    await createAuditEntry(prisma, {
      entityType: "Control",
      entityId: control.id,
      action: "CREATE",
      userId,
      rationale: "Initial creation",
    });

    return NextResponse.json({ control }, { status: 201 });
  } catch (error) {
    console.error("Create control error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, userId = "system", changeReason, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Control id is required" }, { status: 400 });
    }

    const existing = await prisma.control.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    if (existing.reviewStatus === "APPROVED") {
      return NextResponse.json({
        error: "Cannot edit approved controls. Reopen first.",
      }, { status: 409 });
    }

    const merged = { ...existing, ...updates, changeReason };
    const errors = validateControl(merged, "edit");
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const diffs = computeDiffs(existing, updates, TRACKED_FIELDS.Control);

    const control = await prisma.control.update({
      where: { id },
      data: {
        ...updates,
        changeReason,
        version: existing.version + 1,
        reviewStatus: existing.reviewStatus !== "DRAFT" ? "DRAFT" : existing.reviewStatus,
      },
      include: { process: true },
    });

    for (const diff of diffs) {
      await createAuditEntry(prisma, {
        entityType: "Control",
        entityId: id,
        action: "EDIT",
        field: diff.field,
        previousValue: diff.previousValue,
        newValue: diff.newValue,
        userId,
        rationale: changeReason,
      });
    }

    if (existing.reviewStatus !== "DRAFT" && control.reviewStatus === "DRAFT") {
      await createStatusLogEntry(prisma, {
        controlId: id,
        fromStatus: existing.reviewStatus,
        toStatus: "DRAFT",
        statusType: "REVIEW",
        changedBy: userId,
        comment: `Auto-reset due to edit: ${changeReason}`,
      });
    }

    return NextResponse.json({ control });
  } catch (error) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ errors: [{ field: error.field, message: error.message }] }, { status: 422 });
    }
    console.error("Update control error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId") || "system";

  if (!id) {
    return NextResponse.json({ error: "Control id is required" }, { status: 400 });
  }

  const existing = await prisma.control.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Control not found" }, { status: 404 });
  }

  if (existing.reviewStatus === "APPROVED") {
    return NextResponse.json({ error: "Cannot delete approved controls. Retire instead." }, { status: 409 });
  }

  await createAuditEntry(prisma, {
    entityType: "Control",
    entityId: id,
    action: "DELETE",
    userId,
    rationale: "Deleted by user",
  });

  await prisma.control.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
