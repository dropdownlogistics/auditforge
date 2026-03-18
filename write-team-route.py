import os

os.makedirs('src/app/api/audits/[id]/team', exist_ok=True)

content = '''// AuditForge — Audit Team Management API
// app/api/audits/[id]/team/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = await params;

  let audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  const team = await prisma.auditAuditor.findMany({
    where: { auditId: audit.id },
    include: {
      auditor: {
        select: {
          auditorId: true, auditorName: true, role: true,
          certifications: true, specializations: true,
          strengthTokens: true, weaknessTokens: true,
        }
      }
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ team, count: team.length });
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    let audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    if (audit.status === "COMPLETED" || audit.status === "CANCELLED") {
      return NextResponse.json({ error: `Cannot modify team of ${audit.status} audit` }, { status: 400 });
    }

    const { members } = body;
    // members: [{ auditorId, teamRole, assignedPhase, budgetHours }]
    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: "members array required" }, { status: 400 });
    }

    const results = [];
    for (const m of members) {
      // Resolve auditor
      const auditor = await prisma.auditor.findFirst({
        where: {
          OR: [
            { id: m.auditorId },
            { auditorId: m.auditorId },
          ]
        }
      });
      if (!auditor) continue;

      // Upsert — delete existing if present
      await prisma.auditAuditor.deleteMany({
        where: { auditId: audit.id, auditorId: auditor.id }
      });

      const assignment = await prisma.auditAuditor.create({
        data: {
          auditId: audit.id,
          auditorId: auditor.id,
          teamRole: m.teamRole || "STAFF",
          assignedPhase: m.assignedPhase || "ALL",
          budgetHours: m.budgetHours ? parseFloat(m.budgetHours) : null,
        },
        include: {
          auditor: { select: { auditorId: true, auditorName: true, role: true } }
        }
      });
      results.push(assignment);
    }

    await prisma.auditTrail.create({
      data: {
        entityType: "AuditTeam",
        entityId: audit.id,
        action: "TEAM_UPDATE",
        userId: body.userId || "system",
        newValues: { members: results.map(r => r.auditor.auditorId) },
        rationale: `Team updated: ${results.length} members assigned`,
      },
    });

    return NextResponse.json({ assigned: results.length, team: results }, { status: 201 });
  } catch (e) {
    console.error("Team update failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    let audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) audit = await prisma.audit.findUnique({ where: { auditId: id } });
    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    const { auditorIds, rationale } = body;
    if (!auditorIds || !rationale) {
      return NextResponse.json({ error: "auditorIds and rationale required" }, { status: 400 });
    }

    const auditors = await prisma.auditor.findMany({
      where: { OR: [{ id: { in: auditorIds } }, { auditorId: { in: auditorIds } }] }
    });

    const removed = await prisma.auditAuditor.deleteMany({
      where: {
        auditId: audit.id,
        auditorId: { in: auditors.map(a => a.id) }
      }
    });

    return NextResponse.json({ removed: removed.count });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
'''

with open('src/app/api/audits/[id]/team/route.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Team route created')
