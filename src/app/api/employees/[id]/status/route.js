import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request, context) {
  const { id } = await context.params;

  let employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) employee = await prisma.employee.findFirst({ where: { auditorId: id } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const changes = await prisma.statusChange.findMany({
    where: { employeeId: employee.id },
    include: {
      fromStatus: { select: { parent: true, childLabel: true } },
      toStatus: { select: { parent: true, childLabel: true } },
    },
    orderBy: { effectiveDate: "desc" },
  });

  const current = employee.statusId
    ? await prisma.employeeStatus.findUnique({ where: { id: employee.statusId } })
    : null;

  return NextResponse.json({
    employeeId: employee.auditorId,
    employeeName: employee.firstName && employee.lastName
      ? `${employee.firstName} ${employee.lastName}`
      : employee.auditorName,
    currentStatus: current,
    changes,
    count: changes.length,
  });
}

export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { toStatusId, reason, effectiveDate } = body;

    if (!toStatusId) {
      return NextResponse.json({ error: "toStatusId required" }, { status: 400 });
    }

    let employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) employee = await prisma.employee.findFirst({ where: { auditorId: id } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const toStatus = await prisma.employeeStatus.findUnique({ where: { id: toStatusId } });
    if (!toStatus) return NextResponse.json({ error: "Invalid toStatusId" }, { status: 400 });

    const change = await prisma.statusChange.create({
      data: {
        employeeId: employee.id,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        fromStatusId: employee.statusId || null,
        toStatusId,
        reason: reason || null,
        authoredBy: body.userId || "system",
      },
      include: {
        fromStatus: { select: { parent: true, childLabel: true } },
        toStatus: { select: { parent: true, childLabel: true } },
      },
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: { statusId: toStatusId },
    });

    await prisma.auditTrail.create({
      data: {
        entityType: "Employee",
        entityId: employee.id,
        action: "STATUS_CHANGE",
        userId: body.userId || "system",
        previousValues: { statusId: employee.statusId },
        newValues: { statusId: toStatusId },
        rationale: reason || `Status → ${toStatus.parent}/${toStatus.childLabel}`,
      },
    });

    return NextResponse.json(change, { status: 201 });
  } catch (e) {
    console.error("Status change failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
