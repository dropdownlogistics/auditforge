import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyIdParam = searchParams.get("companyId") || "CO-DDL";
  const auditIdParam = searchParams.get("auditId");

  const resolved = await resolveCompanyId(companyIdParam);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const where = { companyId: resolved };
  if (auditIdParam) {
    const audit = await prisma.audit.findUnique({ where: { auditId: auditIdParam }, select: { id: true } });
    if (!audit) return NextResponse.json({ findings: [], count: 0 });
    where.auditId = audit.id;
  }

  const findings = await prisma.finding.findMany({
    where,
    include: {
      audit: { select: { auditId: true, auditName: true, status: true } },
      control: { select: { controlId: true, description: true } },
    },
    orderBy: [{ severity: "asc" }, { status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ findings, count: findings.length });
}
