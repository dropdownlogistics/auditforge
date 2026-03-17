// AuditForge — Bulk Import API Route
// POST /api/import
//
// Accepts: { companyId, controls: [...], mode: "preview" | "execute" }
// Returns: { created, updated, skipped, warnings, rows (preview only) }
//
// Preview mode validates without writing.
// Execute mode upserts valid rows, skips invalid, logs all to AuditTrail.

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/middleware/validation";

// ── Enums ────────────────────────────────────────────────────────────────────

const VALID_CONTROL_TYPES  = ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"];
const VALID_FREQUENCIES    = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ANNUALLY", "AD_HOC"];
const VALID_NATURES        = ["MANUAL", "AUTOMATED", "IT_DEPENDENT_MANUAL", null, undefined, ""];
const VALID_EFFECTIVENESS  = ["EFFECTIVE", "INEFFECTIVE", "NOT_TESTED", "PARTIALLY_EFFECTIVE", null, undefined, ""];
const CONTROL_ID_RE        = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,}$/;

// ── Validate a single control row ────────────────────────────────────────────

function validateControl(ctrl, rowIndex) {
  const errors = [];

  if (!ctrl.controlId)
    errors.push("controlId is required");
  else if (!CONTROL_ID_RE.test(ctrl.controlId.toUpperCase()))
    errors.push(`controlId "${ctrl.controlId}" must match pattern like CTRL-AP-001`);

  if (!ctrl.description)
    errors.push("description is required");

  if (!ctrl.controlType)
    errors.push("controlType is required");
  else if (!VALID_CONTROL_TYPES.includes(ctrl.controlType.toUpperCase()))
    errors.push(`controlType must be one of: ${VALID_CONTROL_TYPES.join(", ")}`);

  if (!ctrl.controlFrequency)
    errors.push("controlFrequency is required");
  else if (!VALID_FREQUENCIES.includes(ctrl.controlFrequency.toUpperCase()))
    errors.push(`controlFrequency must be one of: ${VALID_FREQUENCIES.join(", ")}`);

  if (!ctrl.processArea)
    errors.push("processArea is required");

  if (ctrl.controlNature && !VALID_NATURES.includes(ctrl.controlNature.toUpperCase()))
    errors.push(`controlNature must be one of: ${["MANUAL","AUTOMATED","IT_DEPENDENT_MANUAL"].join(", ")}`);

  if (ctrl.designEffectiveness && !VALID_EFFECTIVENESS.includes(ctrl.designEffectiveness.toUpperCase()))
    errors.push(`designEffectiveness must be one of: EFFECTIVE, INEFFECTIVE, NOT_TESTED`);

  if (ctrl.operatingEffectiveness && !VALID_EFFECTIVENESS.includes(ctrl.operatingEffectiveness.toUpperCase()))
    errors.push(`operatingEffectiveness must be one of: EFFECTIVE, INEFFECTIVE, NOT_TESTED`);

  return { rowIndex, controlId: ctrl.controlId, errors, valid: errors.length === 0 };
}

// ── Normalize control for upsert ─────────────────────────────────────────────

function normalizeControl(ctrl) {
  const upper = (v) => (v ? v.toUpperCase() : undefined);
  const bool  = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string")  return ["yes","true","1"].includes(v.toLowerCase());
    return false;
  };
  return {
    controlId:              ctrl.controlId.toUpperCase(),
    description:            ctrl.description.trim(),
    controlType:            upper(ctrl.controlType),
    controlFrequency:       upper(ctrl.controlFrequency),
    processArea:            ctrl.processArea.trim(),
    processName:            ctrl.processName?.trim() || null,
    controlObjective:       ctrl.controlObjective?.trim() || null,
    controlNature:          upper(ctrl.controlNature) || "MANUAL",
    keyControl:             bool(ctrl.keyControl),
    designEffectiveness:    upper(ctrl.designEffectiveness) || "NOT_TESTED",
    operatingEffectiveness: upper(ctrl.operatingEffectiveness) || "NOT_TESTED",
    riskIds:                Array.isArray(ctrl.riskIds) ? ctrl.riskIds.filter(Boolean) : [],
    ownerName:              ctrl.ownerName?.trim() || null,
  };
}

// ── Resolve or create process ────────────────────────────────────────────────

async function resolveProcess(processArea, processName, companyDbId) {
  const area = processArea.trim();
  const name = (processName || area).trim();

  // Look for existing process in this company
  const existing = await prisma.process.findFirst({
    where: {
      companyId: companyDbId,
      processArea: area,
      processName: name,
    },
  });
  if (existing) return existing.id;

  // Create if not found
  const count = await prisma.process.count({ where: { companyId: companyDbId } });
  const processId = `PROC-${String(count + 1).padStart(3, "0")}`;
  const created = await prisma.process.create({
    data: {
      processId,
      companyId: companyDbId,
      processArea: area,
      processName: name,
    },
  });
  return created.id;
}

// ── Resolve or create owner ───────────────────────────────────────────────────

async function resolveOwner(ownerName, companyDbId) {
  if (!ownerName) return null;
  const name = ownerName.trim();
  const existing = await prisma.owner.findFirst({
    where: { companyId: companyDbId, ownerName: name },
  });
  return existing?.id || null;
}

// ── Resolve period (use latest active or create FY) ──────────────────────────

async function resolvePeriod(companyDbId) {
  const existing = await prisma.period.findFirst({
    where:   { companyId: companyDbId },
    orderBy: { periodLabel: "desc" },
  });
  if (existing) return existing.id;

  const year = new Date().getFullYear();
  const created = await prisma.period.create({
    data: {
      periodId:    `FY${year}`,
      companyId:   companyDbId,
      periodLabel: `FY${year}`,
    },
  });
  return created.id;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, controls, mode = "execute" } = body;

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }
    if (!Array.isArray(controls) || controls.length === 0) {
      return NextResponse.json({ error: "controls array is required" }, { status: 400 });
    }
    if (!["preview", "execute"].includes(mode)) {
      return NextResponse.json({ error: "mode must be 'preview' or 'execute'" }, { status: 400 });
    }

    // Resolve company
    const companyDbId = await resolveCompanyId(companyId);
    if (!companyDbId) {
      return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
    }

    // Validate all rows
    const validationResults = controls.map((ctrl, i) => validateControl(ctrl, i));
    const validRows    = validationResults.filter((r) => r.valid);
    const invalidRows  = validationResults.filter((r) => !r.valid);
    const warnings     = invalidRows.map((r) =>
      `Row ${r.rowIndex + 1} (${r.controlId || "unknown"}): ${r.errors.join("; ")}`
    );

    // Preview mode — return validation results only
    if (mode === "preview") {
      return NextResponse.json({
        mode:     "preview",
        total:    controls.length,
        valid:    validRows.length,
        invalid:  invalidRows.length,
        warnings,
        rows:     validationResults,
      });
    }

    // Execute mode — upsert valid rows
    const periodId = await resolvePeriod(companyDbId);
    let created = 0;
    let updated = 0;

    for (const result of validRows) {
      const ctrl = normalizeControl(controls[result.rowIndex]);

      const processId = await resolveProcess(ctrl.processArea, ctrl.processName, companyDbId);
      const ownerId   = await resolveOwner(ctrl.ownerName, companyDbId);

      // Check if control already exists
      const existing = await prisma.control.findFirst({
        where: { companyId: companyDbId, controlId: ctrl.controlId },
      });

      const controlData = {
        controlId:              ctrl.controlId,
        companyId:              companyDbId,
        processId,
        periodId,
        ownerId,
        description:            ctrl.description,
        controlType:            ctrl.controlType,
        controlNature:          ctrl.controlNature,
        controlFrequency:       ctrl.controlFrequency,
        keyControl:             ctrl.keyControl,
        designEffectiveness:    ctrl.designEffectiveness,
        operatingEffectiveness: ctrl.operatingEffectiveness,
        reviewStatus:           "DRAFT",
        lifecycle:              "ACTIVE",
        version:                1,
      };

      if (existing) {
        await prisma.control.update({ where: { id: existing.id }, data: controlData });
        updated++;

        // Audit trail
        await createAuditEntry({
          controlId: existing.id,
          action:    "BULK_IMPORT_UPDATE",
          changedBy: "IMPORT",
          rationale: `Bulk import updated control ${ctrl.controlId}`,
          diffs:     [{ field: "bulk_import", before: "existing", after: "updated" }],
        }).catch(() => {}); // Don't fail import if audit write fails
      } else {
        const newControl = await prisma.control.create({ data: controlData });
        created++;

        await createAuditEntry({
          controlId: newControl.id,
          action:    "BULK_IMPORT_CREATE",
          changedBy: "IMPORT",
          rationale: `Bulk import created control ${ctrl.controlId}`,
          diffs:     [],
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      mode:    "execute",
      created,
      updated,
      skipped: invalidRows.length,
      total:   controls.length,
      warnings,
    });

  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GET: return last 20 import audit entries ──────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const companyDbId = await resolveCompanyId(companyId);
  if (!companyDbId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const entries = await prisma.auditTrail.findMany({
    where: {
      action:   { in: ["BULK_IMPORT_CREATE", "BULK_IMPORT_UPDATE"] },
      control:  { companyId: companyDbId },
    },
    orderBy: { createdAt: "desc" },
    take:    20,
    include: { control: { select: { controlId: true } } },
  });

  return NextResponse.json({ entries });
}




