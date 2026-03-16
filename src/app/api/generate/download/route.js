// AuditForge — Document Download API
// app/api/generate/download/route.js
// Generates any document type and returns as downloadable file

import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // RCM, MCL, WALKTHROUGH, AUDIT_PLAN
    const companyId = searchParams.get("companyId") || "CO-DDL";

    if (!type) {
      return NextResponse.json({ error: "type parameter required (RCM, MCL, WALKTHROUGH, AUDIT_PLAN)" }, { status: 400 });
    }

    const resolved = await resolveCompanyId(companyId);
    if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const company = await prisma.company.findUnique({ where: { id: resolved } });
    const period = await prisma.period.findFirst({ where: { companyId: resolved }, orderBy: { periodStart: "desc" } });

    if (!period) return NextResponse.json({ error: "No period found" }, { status: 404 });


    // Get controls for generation
    const controls = await prisma.control.findMany({
      where: { companyId: resolved, periodId: period.id },
      include: {
        process: true,
        owner: true,
        period: true,
        company: true,
        risks: { where: { validTo: null }, include: { risk: true } },
        assertions: { where: { validTo: null }, include: { assertion: true } },
        frameworks: { where: { validTo: null }, include: { framework: true } },
      },
      orderBy: [{ process: { processArea: "asc" } }, { controlId: "asc" }],
    });

    // Flatten for generators
    const flatControls = controls.map((ctrl) => ({
      controlId: ctrl.controlId,
      controlDescription: ctrl.description,
      controlObjective: ctrl.objective,
      controlType: ctrl.controlType,
      controlNature: ctrl.controlNature,
      controlFrequency: ctrl.controlFrequency,
      keyControl: ctrl.keyControl,
      designEffectiveness: ctrl.designEffectiveness,
      operatingEffectiveness: ctrl.operatingEffectiveness,
      reviewStatus: ctrl.reviewStatus,
      lifecycle: ctrl.lifecycle,
      evidenceDescription: ctrl.evidenceDescription,
      testProcedure: ctrl.testProcedure,
      version: ctrl.version,
      processArea: ctrl.process.processArea,
      processName: ctrl.process.processName,
      subprocessName: ctrl.process.subprocessName,
      processOwner: ctrl.process.processOwner,
      processDescription: ctrl.process.description,
      ownerName: ctrl.owner?.ownerName || "Unassigned",
      ownerTitle: ctrl.owner?.title || "",
      ownerDepartment: ctrl.owner?.department || "",
      periodLabel: ctrl.period.periodLabel,
      companyName: ctrl.company.name,
      companyId: ctrl.company.companyId,
      riskIds: ctrl.risks.map((cr) => cr.risk.riskId),
      riskDescriptions: ctrl.risks.map((cr) => cr.risk.description),
      riskRatings: ctrl.risks.map((cr) => cr.risk.inherentRiskRating),
      riskId: ctrl.risks[0]?.risk.riskId || "N/A",
      riskDescription: ctrl.risks[0]?.risk.description || "No risk mapped",
      inherentRiskRating: ctrl.risks[0]?.risk.inherentRiskRating || "MEDIUM",
      assertions: ctrl.assertions.map((ca) => ca.assertion.assertionName),
      frameworkRefs: ctrl.frameworks.map((cf) => cf.framework.requirementId),
      frameworkNames: ctrl.frameworks.map((cf) => `${cf.framework.frameworkName} ${cf.framework.requirementId}`),
    }));

    let result;
    let contentType;

    switch (type.toUpperCase()) {
      case "RCM": {
        const { generateRCM } = require("@/lib/generators/rcm-generator");
        result = await generateRCM({
          companyName: company.name,
          periodLabel: period.periodLabel,
          controls: flatControls,
        });
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      }
      case "MCL": {
        const { generateMCL } = require("@/lib/generators/mcl-generator");
        result = await generateMCL({
          companyName: company.name,
          periodLabel: period.periodLabel,
          controls: flatControls,
        });
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      }
      case "WALKTHROUGH": {
        const { generateWalkthrough } = require("@/lib/generators/walkthrough-generator");
        // Generate all walkthroughs, return first (or zip later)
        const processAreas = [...new Set(flatControls.map((c) => c.processArea))];
        const area = searchParams.get("processArea") || processAreas[0];
        const areaControls = flatControls.filter((c) => c.processArea === area);
        const riskIds = [...new Set(areaControls.flatMap((c) => c.riskIds))];
        const risks = await prisma.risk.findMany({ where: { companyId: resolved, riskId: { in: riskIds } } });
        const process = await prisma.process.findFirst({ where: { companyId: resolved, processArea: area } });

        result = await generateWalkthrough({
          companyName: company.name,
          periodLabel: period.periodLabel,
          process,
          controls: areaControls,
          risks,
          preparedBy: "Dave Kitchens, CPA",
        });
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      }
      case "AUDIT_PLAN": {
        const { generateAuditPlan } = require("@/lib/generators/audit-plan-generator");
        const auditId = searchParams.get("auditId") || "AUD-2025-001";
        const audit = await prisma.audit.findUnique({
          where: { auditId },
          include: { leadAuditor: true, period: true },
        });
        if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

        const scope = await prisma.auditControlScope.findMany({
          where: { auditId: audit.id, validTo: null },
          include: {
            control: {
              include: {
                process: true,
                owner: true,
                risks: { where: { validTo: null }, include: { risk: true } },
              },
            },
            assignedTo: true,
          },
          orderBy: { control: { controlId: "asc" } },
        });

        result = await generateAuditPlan({
          audit: { ...audit, leadAuditorName: audit.leadAuditor.auditorName },
          scope,
          companyName: company.name,
          periodLabel: audit.period.periodLabel,
        });
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const fileBuffer = result.buffer;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
