// AuditForge — Auditors API Route
// app/api/auditors/route.js
import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const auditors = await prisma.auditor.findMany({
    where: { companyId: resolved, isActive: true },
    orderBy: { auditorName: "asc" },
  });

  return NextResponse.json({ auditors, count: auditors.length });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, auditorId, auditorName, title, department, email, certifications, independence, firm } = body;

    if (!companyId || !auditorId || !auditorName) {
      return NextResponse.json({ error: "companyId, auditorId, and auditorName required" }, { status: 400 });
    }

    const resolved = await resolveCompanyId(companyId);
    if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const auditor = await prisma.auditor.create({
      data: {
        auditorId,
        companyId: resolved,
        auditorName,
        title,
        department,
        email,
        certifications,
        independence: independence || "INTERNAL",
        firm,
      },
    });

    return NextResponse.json(auditor, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
