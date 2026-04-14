import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const rates = await prisma.billingRate.findMany({
    where: { companyId: resolved },
    orderBy: [{ role: "asc" }, { effectiveDate: "desc" }],
  });

  return NextResponse.json({ rates, count: rates.length });
}
