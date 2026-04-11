// AuditForge — Process Import API Route
// POST /api/import/processes
// { companyId, processes: [...], mode: "preview" | "execute" }

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

const PROCESS_ID_RE = /^PROC-[A-Z]{2,6}-\d{3,4}$/;

function validateProcess(proc, idx) {
  const errors = [];
  if (!proc.processId) {
    errors.push("processId required");
  } else if (!PROCESS_ID_RE.test(proc.processId.toUpperCase())) {
    errors.push(`processId "${proc.processId}" must match pattern: PROC-{AREA}-{SEQ} (e.g., PROC-GOV-001)`);
  }
  if (!proc.processArea) errors.push("processArea required");
  if (!proc.processName) errors.push("processName required");
  return { rowIndex: idx, processId: proc.processId, errors, valid: errors.length === 0 };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, processes, mode = "execute" } = body;

    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
    if (!Array.isArray(processes) || processes.length === 0) return NextResponse.json({ error: "processes array required" }, { status: 400 });

    const companyDbId = await resolveCompanyId(companyId);
    if (!companyDbId) return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });

    const validationResults = processes.map((p, i) => validateProcess(p, i));
    const validRows   = validationResults.filter((r) => r.valid);
    const invalidRows = validationResults.filter((r) => !r.valid);
    const warnings    = invalidRows.map((r) => `Row ${r.rowIndex + 1} (${r.processId || "unknown"}): ${r.errors.join("; ")}`);

    if (mode === "preview") {
      return NextResponse.json({ mode: "preview", total: processes.length, valid: validRows.length, invalid: invalidRows.length, warnings });
    }

    let created = 0;
    let updated = 0;

    for (const result of validRows) {
      const p = processes[result.rowIndex];

      const procData = {
        processId:      p.processId.trim().toUpperCase(),
        companyId:      companyDbId,
        processArea:    p.processArea.trim(),
        processName:    p.processName.trim(),
        subprocessName: p.subprocessName?.trim() || null,
        processOwner:   p.processOwner?.trim() || null,
        description:    p.description?.trim() || null,
      };

      const existing = await prisma.process.findFirst({
        where: { companyId: companyDbId, processId: procData.processId },
      });

      if (existing) {
        await prisma.process.update({ where: { id: existing.id }, data: procData });
        updated++;
      } else {
        await prisma.process.create({ data: procData });
        created++;
      }
    }

    return NextResponse.json({ mode: "execute", created, updated, skipped: invalidRows.length, total: processes.length, warnings });

  } catch (err) {
    console.error("Process import error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
