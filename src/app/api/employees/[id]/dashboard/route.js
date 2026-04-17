import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request, context) {
  const { id } = await context.params;

  // Resolve by auditorId (business key) or internal id
  let employee = await prisma.employee.findFirst({ where: { auditorId: id } });
  if (!employee) employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const empId = employee.id;

  const [
    profile,
    role,
    status,
    audits,
    scope,
    timeEntries,
    tokens,
    compChanges,
  ] = await Promise.all([
    prisma.auditorProfile.findUnique({ where: { employeeId: empId } }),
    employee.roleId ? prisma.role.findUnique({ where: { id: employee.roleId } }) : null,
    employee.statusId ? prisma.employeeStatus.findUnique({ where: { id: employee.statusId } }) : null,
    prisma.auditAuditor.findMany({
      where: { auditorId: empId },
      include: {
        audit: {
          select: {
            id: true,
            auditId: true,
            auditName: true,
            status: true,
            startDate: true,
            endDate: true,
            leadAuditorId: true,
            controlScope: {
              where: { inScope: true },
              include: {
                control: {
                  select: {
                    controlId: true,
                    process: { select: { processArea: true } },
                  },
                },
              },
            },
            team: {
              include: {
                auditor: { select: { auditorName: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.auditControlScope.findMany({
      where: { assignedToId: empId, inScope: true },
      include: {
        control: {
          select: {
            controlId: true,
            process: { select: { processArea: true } },
          },
        },
        audit: { select: { auditId: true, auditName: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: { auditorId: empId },
      select: { date: true, hours: true, engagementId: true },
      orderBy: { date: "asc" },
    }),
    prisma.tokenAssessment.findMany({
      where: { employeeId: empId },
      include: { token: { select: { code: true, name: true, polarity: true } } },
    }),
    prisma.compChange.findMany({
      where: { employeeId: empId },
      orderBy: { effectiveDate: "desc" },
    }),
  ]);

  return NextResponse.json({
    employee: {
      id: employee.id,
      auditorId: employee.auditorId,
      auditorName: employee.auditorName,
      firstName: employee.firstName,
      lastName: employee.lastName,
      title: employee.title,
      email: employee.email,
      certifications: employee.certifications,
      hireDate: employee.hireDate,
      departureDate: employee.departureDate,
      isActive: employee.isActive,
      role: employee.role,
    },
    profile,
    dimRole: role,
    dimStatus: status,
    audits,
    scope,
    timeEntries,
    tokens,
    compChanges,
  });
}
