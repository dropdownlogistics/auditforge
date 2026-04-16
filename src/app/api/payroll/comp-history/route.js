import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const employeeId = searchParams.get("employeeId");

  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const where = { employee: { companyId: resolved } };
  if (employeeId) where.employeeId = employeeId;

  const history = await prisma.compChange.findMany({
    where,
    include: {
      employee: {
        select: { auditorName: true, firstName: true, lastName: true, auditorId: true },
      },
    },
    orderBy: [{ employeeId: "asc" }, { effectiveDate: "desc" }],
  });

  return NextResponse.json({ history });
}
