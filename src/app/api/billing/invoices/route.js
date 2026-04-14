import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const invoices = await prisma.invoice.findMany({
    where: { companyId: resolved },
    include: {
      audit: { select: { auditId: true, auditName: true, status: true } },
      arEntries: true,
    },
    orderBy: { invoiceDate: "desc" },
  });

  return NextResponse.json({ invoices, count: invoices.length });
}
