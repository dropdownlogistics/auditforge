// AuditForge — Owners API Route
// app/api/owners/route.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOwner, createAuditEntry, computeDiffs, TRACKED_FIELDS } from "@/lib/middleware/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const owners = await prisma.owner.findMany({
    where: { companyId },
    include: { controls: { select: { controlId: true, lifecycle: true } } },
    orderBy: { ownerName: "asc" },
  });

  return NextResponse.json({
    owners: owners.map((o) => ({
      ...o,
      activeControlCount: o.controls.filter((c) => c.lifecycle === "ACTIVE").length,
    })),
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = "system", ...data } = body;
    const errors = validateOwner(data);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

    const owner = await prisma.owner.create({
      data: {
        companyId: data.companyId, ownerName: data.ownerName,
        title: data.title || null, department: data.department || null,
        email: data.email || null,
      },
    });

    await createAuditEntry(prisma, { entityType: "Owner", entityId: owner.id, action: "CREATE", userId, rationale: "Initial creation" });
    return NextResponse.json({ owner }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, userId = "system", changeReason, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Owner id required" }, { status: 400 });
    if (!changeReason) return NextResponse.json({ errors: [{ field: "changeReason", message: "Change reason required" }] }, { status: 422 });

    const existing = await prisma.owner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Owner not found" }, { status: 404 });

    const diffs = computeDiffs(existing, updates, TRACKED_FIELDS.Owner);
    const owner = await prisma.owner.update({ where: { id }, data: updates });

    for (const diff of diffs) {
      await createAuditEntry(prisma, { entityType: "Owner", entityId: id, action: "EDIT", field: diff.field, previousValue: diff.previousValue, newValue: diff.newValue, userId, rationale: changeReason });
    }
    return NextResponse.json({ owner });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
