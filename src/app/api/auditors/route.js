// AuditForge — Auditors API Route
// app/api/auditors/route.js
import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

    const resolved = await resolveCompanyId(companyId);
    if (!resolved) return NextResponse.json({ error: "Company not found", companyId }, { status: 404 });

    // Enriched query with Phase B includes. If any relation fails (e.g. Prisma client
    // stale on deploy), fall back to basic employee query so Roster still populates.
    try {
      const auditors = await prisma.employee.findMany({
        where: { companyId: resolved, isActive: true },
        include: {
          auditorProfile: true,
          dimRole: { select: { label: true, level: true } },
          dimDepartment: { select: { name: true } },
          dimStatus: { select: { parent: true, childLabel: true } },
          tokenAssessments: {
            include: { token: { select: { code: true, name: true, polarity: true } } },
          },
          compChanges: {
            orderBy: { effectiveDate: "desc" },
            take: 1,
            select: { newRate: true, payCadence: true, effectiveDate: true, changeType: true },
          },
        },
        orderBy: { auditorName: "asc" },
      });
      return NextResponse.json({ auditors, count: auditors.length });
    } catch (includeErr) {
      console.error("[/api/auditors] enriched query failed, falling back to basic:", includeErr.message);
      const auditors = await prisma.employee.findMany({
        where: { companyId: resolved, isActive: true },
        orderBy: { auditorName: "asc" },
      });
      return NextResponse.json({ auditors, count: auditors.length, fallback: true, enrichedError: includeErr.message });
    }
  } catch (e) {
    console.error("[/api/auditors] GET failed:", e);
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) }, { status: 500 });
  }
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

    const auditor = await prisma.employee.create({
      data: {
        auditorId,
        companyId: resolved,
        auditorName,
        title,
        department,
        email,
        certifications,
      },
    });

    // Create auditor profile with independence/firm (moved from deprecated Employee columns)
    if (independence || firm) {
      await prisma.auditorProfile.create({
        data: {
          employeeId: auditor.id,
          independence: independence || "INTERNAL",
          firm: firm || null,
        },
      });
    }

    return NextResponse.json(auditor, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
