import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/time-entries?auditId=xxx&auditorId=xxx&monthTag=2026-03
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const auditorId = searchParams.get('auditorId');
    const monthTag = searchParams.get('monthTag');

    const where = {};
    if (auditId) where.engagementId = auditId;
    if (auditorId) where.auditorId = auditorId;
    if (monthTag) where.monthTag = monthTag;

    const entries = await prisma.fact_TimeEntry.findMany({
      where,
      include: {
        auditor: { select: { auditorName: true, role: true } },
        engagement: { select: { auditName: true, auditId: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate totals
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const billableHours = entries.filter(e => e.timeType === 'BILLABLE').reduce((sum, e) => sum + e.hours, 0);
    const nonBillableHours = totalHours - billableHours;

    return NextResponse.json({
      entries,
      summary: {
        totalHours,
        billableHours,
        nonBillableHours,
        billablePct: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('GET /api/time-entries error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/time-entries — single entry or batch
export async function POST(request) {
  try {
    const body = await request.json();
    const { entries, single } = body;

    if (single) {
      // Single entry
      const { auditorId, engagementId, date, hours, timeType, component, category, comments } = single;

      const monthTag = new Date(date).toISOString().slice(0, 7); // 2026-03

      const entry = await prisma.fact_TimeEntry.create({
        data: {
          auditorId,
          engagementId,
          date: new Date(date),
          monthTag,
          hours: parseFloat(hours),
          timeType: timeType || 'BILLABLE',
          component: component || 'Fieldwork',
          category: category || 'Audits',
          comments: comments || null,
        },
      });

      return NextResponse.json({ entry }, { status: 201 });
    }

    if (entries && Array.isArray(entries)) {
      // Batch insert — from weekly grid
      const data = entries.map(e => ({
        auditorId: e.auditorId,
        engagementId: e.engagementId,
        date: new Date(e.date),
        monthTag: new Date(e.date).toISOString().slice(0, 7),
        hours: parseFloat(e.hours),
        timeType: e.timeType || 'BILLABLE',
        component: e.component || 'Fieldwork',
        category: e.category || 'Audits',
        comments: e.comments || null,
      })).filter(e => e.hours > 0); // skip zeros like your TimeDump

      const result = await prisma.fact_TimeEntry.createMany({ data });

      return NextResponse.json({ count: result.count }, { status: 201 });
    }

    return NextResponse.json({ error: 'Provide single or entries array' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/time-entries error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/time-entries?id=xxx
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.fact_TimeEntry.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
