// AuditForge — Risk Import API Route
// POST /api/import/risks
// { companyId, risks: [...], mode: "preview" | "execute" }

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

const RISK_ID_RE    = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,}$/;
const VALID_RATINGS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const VALID_CATS    = ["OPERATIONAL", "FINANCIAL", "COMPLIANCE", "STRATEGIC", "TECHNOLOGY"];

function validateRisk(risk, idx) {
  const errors = [];
  if (!risk.riskId) errors.push("riskId required");
  else if (!RISK_ID_RE.test(risk.riskId.toUpperCase())) errors.push(`riskId format invalid (e.g. RSK-AP-001)`);
  if (!risk.description) errors.push("description required");
  if (risk.inherentRiskRating && !VALID_RATINGS.includes(risk.inherentRiskRating.toUpperCase()))
    errors.push(`inherentRiskRating must be: ${VALID_RATINGS.join(", ")}`);
  if (risk.category && !VALID_CATS.includes(risk.category.toUpperCase()))
    errors.push(`category must be: ${VALID_CATS.join(", ")}`);
  return { rowIndex: idx, riskId: risk.riskId, errors, valid: errors.length === 0 };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, risks, mode = "execute" } = body;

    if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
    if (!Array.isArray(risks) || risks.length === 0) return NextResponse.json({ error: "risks array required" }, { status: 400 });

    const companyDbId = await resolveCompanyId(companyId);
    if (!companyDbId) return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });

    const validationResults = risks.map((r, i) => validateRisk(r, i));
    const validRows   = validationResults.filter((r) => r.valid);
    const invalidRows = validationResults.filter((r) => !r.valid);
    const warnings    = invalidRows.map((r) => `Row ${r.rowIndex + 1} (${r.riskId || "unknown"}): ${r.errors.join("; ")}`);

    if (mode === "preview") {
      return NextResponse.json({ mode: "preview", total: risks.length, valid: validRows.length, invalid: invalidRows.length, warnings });
    }

    let created = 0;
    let updated = 0;

    for (const result of validRows) {
      const r = risks[result.rowIndex];
      const up = (v, fallback) => (v ? v.toUpperCase() : fallback);

      const riskData = {
        riskId:             r.riskId.toUpperCase(),
        companyId:          companyDbId,
        description:        r.description.trim(),
        category:           up(r.category, "OPERATIONAL"),
        likelihood:         up(r.likelihood, "MEDIUM"),
        impact:             up(r.impact, "MEDIUM"),
        inherentRiskRating: up(r.inherentRiskRating, "MEDIUM"),
        residualRiskRating: r.residualRiskRating ? up(r.residualRiskRating, undefined) : null,
        riskResponse:       r.riskResponse?.trim() || null,
      };

      const existing = await prisma.risk.findFirst({
        where: { companyId: companyDbId, riskId: riskData.riskId },
      });

      if (existing) {
        await prisma.risk.update({ where: { id: existing.id }, data: riskData });
        updated++;
      } else {
        await prisma.risk.create({ data: riskData });
        created++;
      }
    }

    return NextResponse.json({ mode: "execute", created, updated, skipped: invalidRows.length, total: risks.length, warnings });

  } catch (err) {
    console.error("Risk import error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
