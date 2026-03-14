// AuditForge — Processes API Route
// app/api/processes/route.js

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";
import { validateProcess, createAuditEntry, computeDiffs, TRACKED_FIELDS } from "@/lib/middleware/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const processes = await prisma.process.findMany({
    where: { companyId },
    include: {
      controls: {
        select: { controlId: true, keyControl: true, lifecycle: true, reviewStatus: true },
      },
    },
    orderBy: [{ processArea: "asc" }, { processName: "asc" }],
  });

  return NextResponse.json({ processes, count: processes.length });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = "system", ...data } = body;
    const errors = validateProcess(data);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

    const existing = await prisma.process.findFirst({ where: { companyId: data.companyId, processId: data.processId } });
    if (existing) return NextResponse.json({ errors: [{ field: "processId", message: `Process ${data.processId} already exists` }] }, { status: 409 });

    const process = await prisma.process.create({
      data: {
        processId: data.processId, companyId: data.companyId,
        processArea: data.processArea, processName: data.processName,
        subprocessName: data.subprocessName || null,
        processOwner: data.processOwner || null, description: data.description || null,
      },
    });

    await createAuditEntry(prisma, { entityType: "Process", entityId: process.id, action: "CREATE", userId, rationale: "Initial creation" });
    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, userId = "system", changeReason, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Process id required" }, { status: 400 });
    if (!changeReason) return NextResponse.json({ errors: [{ field: "changeReason", message: "Change reason required" }] }, { status: 422 });

    const existing = await prisma.process.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Process not found" }, { status: 404 });

    const diffs = computeDiffs(existing, updates, TRACKED_FIELDS.Process);
    const process = await prisma.process.update({ where: { id }, data: updates });

    for (const diff of diffs) {
      await createAuditEntry(prisma, { entityType: "Process", entityId: id, action: "EDIT", field: diff.field, previousValue: diff.previousValue, newValue: diff.newValue, userId, rationale: changeReason });
    }
    return NextResponse.json({ process });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId") || "system";
  if (!id) return NextResponse.json({ error: "Process id required" }, { status: 400 });

  const existing = await prisma.process.findUnique({ where: { id }, include: { controls: true } });
  if (!existing) return NextResponse.json({ error: "Process not found" }, { status: 404 });
  if (existing.controls.length > 0) return NextResponse.json({ error: "Cannot delete process with linked controls" }, { status: 409 });

  await createAuditEntry(prisma, { entityType: "Process", entityId: id, action: "DELETE", userId, rationale: "Deleted by user" });
  await prisma.process.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
