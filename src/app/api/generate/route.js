// ============================================================
// AuditForge — Document Generation API (v0.3)
// app/api/generate/route.js
// Item 5: Template snapshot stored with each generation
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";


// Dynamic imports for generators (server-side only)
async function getGenerators() {
  const { generateRCM } = require("@/lib/generators/rcm-generator");
  const { generateMCL } = require("@/lib/generators/mcl-generator");
  const { generateWalkthrough } = require("@/lib/generators/walkthrough-generator");
  return { generateRCM, generateMCL, generateWalkthrough };
}

// Resolve star schema joins into flat records for generators
// Only includes active mappings (validTo = null)
async function getControlsForGeneration(companyId, periodId) {
  const controls = await prisma.control.findMany({
    where: {
      companyId,
      periodId,
      lifecycle: { in: ["ACTIVE", "DRAFT"] }, // Include DRAFT for initial generation
    },
    include: {
      process: true,
      period: true,
      company: true,
      scope: true,
      controlTypeDim: { select: { nature: true, automation: true, domain: true, label: true } },
      ownerEmployee: { select: { auditorName: true, title: true, department: true } },
      ownerRole: { select: { roleName: true } },
      risks: { where: { validTo: null }, include: { risk: true } },
      controlObjectives: { where: { validTo: null }, include: { controlObjective: true } },
      frameworks: { where: { validTo: null }, include: { framework: true } },
    },
    orderBy: [
      { process: { processArea: "asc" } },
      { process: { processName: "asc" } },
      { controlId: "asc" },
    ],
  });

  return controls.map((ctrl) => ({
    controlId: ctrl.controlId,
    controlDescription: ctrl.description,
    controlObjective: ctrl.objective,
    controlType: ctrl.controlTypeDim?.label ?? ctrl.controlTypeDim?.nature ?? 'Unknown',
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
    ownerName: ctrl.ownerEmployee?.auditorName || ctrl.ownerRole?.roleName || ctrl.ownerRoleId || "Unassigned",
    ownerTitle: ctrl.ownerEmployee?.title || "",
    ownerDepartment: ctrl.ownerEmployee?.department || "",
    periodLabel: ctrl.period.periodLabel,
    companyName: ctrl.company.name,
    companyId: ctrl.company.companyId,
    scopeEntity: ctrl.scope?.entity || null,
    scopeBusinessUnit: ctrl.scope?.businessUnit || null,
    scopeLocation: ctrl.scope?.location || null,
    riskIds: ctrl.risks.map((cr) => cr.risk.riskId),
    riskDescriptions: ctrl.risks.map((cr) => cr.risk.description),
    riskRatings: ctrl.risks.map((cr) => cr.risk.inherentRiskRating),
    riskId: ctrl.risks[0]?.risk.riskId || "N/A",
    riskDescription: ctrl.risks[0]?.risk.description || "No risk mapped",
    inherentRiskRating: ctrl.risks[0]?.risk.inherentRiskRating || "MEDIUM",
    assertions: ctrl.controlObjectives.map((ca) => ca.controlObjective.objectiveName),
    frameworkRefs: ctrl.frameworks.map((cf) => cf.framework.requirementId),
    frameworkNames: ctrl.frameworks.map((cf) => `${cf.framework.frameworkName} ${cf.framework.requirementId}`),
  }));
}

// Compute hash of source data for lineage tracking
function computeDataHash(data) {
  const serialized = JSON.stringify(data, Object.keys(data[0] || {}).sort());
  return createHash("sha256").update(serialized).digest("hex").substring(0, 16);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { templateId, companyId, periodId, options = {}, userId = "system" } = body;

    if (!templateId || !companyId || !periodId) {
      return NextResponse.json({ error: "Required: templateId, companyId, periodId" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const period = await prisma.period.findUnique({ where: { id: periodId } });
    if (!period) return NextResponse.json({ error: "Period not found" }, { status: 404 });

    const template = await prisma.template.findUnique({ where: { templateId } });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });


    const generators = await getGenerators();
    let result;
    let controlData;

    switch (template.templateType) {
      case "RCM": {
        controlData = await getControlsForGeneration(companyId, periodId);
        if (controlData.length === 0) return NextResponse.json({ error: "No controls found" }, { status: 404 });
        result = await generators.generateRCM({ companyName: company.name, periodLabel: period.periodLabel, controls: controlData });
        break;
      }
      case "MCL": {
        controlData = await getControlsForGeneration(companyId, periodId);
        if (controlData.length === 0) return NextResponse.json({ error: "No controls found" }, { status: 404 });
        result = await generators.generateMCL({ companyName: company.name, periodLabel: period.periodLabel, controls: controlData });
        break;
      }
      case "WALKTHROUGH": {
        const { processId } = options;
        if (!processId) return NextResponse.json({ error: "processId required for walkthrough" }, { status: 400 });
        controlData = await getControlsForGeneration(companyId, periodId);
        const process = await prisma.process.findUnique({ where: { id: processId } });
        const processControls = controlData.filter((c) => c.processArea === process?.processArea && c.processName === process?.processName);
        const riskIds = [...new Set(processControls.flatMap((c) => c.riskIds))];
        const risks = await prisma.risk.findMany({ where: { companyId, riskId: { in: riskIds } } });
        result = await generators.generateWalkthrough({
          companyName: company.name, periodLabel: period.periodLabel,
          process, controls: processControls, risks,
          preparedBy: options.preparedBy || "AuditForge",
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Template type ${template.templateType} not implemented` }, { status: 501 });
    }

    // Calculate next draft version
    const lastDoc = await prisma.generatedDocument.findFirst({
      where: { templateId: template.id, companyId: company.companyId, periodLabel: period.periodLabel },
      orderBy: { draftVersion: "desc" },
    });
    const draftVersion = (lastDoc?.draftVersion || 0) + 1;

    // Archive previous draft if exists
    if (lastDoc && lastDoc.docStatus === "DRAFT") {
      await prisma.generatedDocument.update({
        where: { id: lastDoc.id },
        data: { docStatus: "ARCHIVED" },
      });
    }

    // ITEM 5: Store template snapshot + data hash
    const doc = await prisma.generatedDocument.create({
      data: {
        templateId: template.id,
        companyId: company.companyId,
        periodLabel: period.periodLabel,
        fileName: result.fileName,
        fileFormat: template.outputFormat,
        templateVersion: template.version,
        templateSnapshot: template.definition,  // ITEM 5: full template config frozen
        draftVersion,
        docStatus: "DRAFT",
        dataHash: controlData ? computeDataHash(controlData) : null,
        generatedBy: userId,
        filePath: result.fileName,
        metadata: {
          generatedAt: new Date().toISOString(),
          controlCount: controlData?.length || 0,
          schemaVersion: "v0.3",
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        fileName: result.fileName,
        draftVersion,
        dataHash: doc.dataHash,
        templateVersion: template.version,
      },
      company: { id: company.companyId, name: company.name },
      period: period.periodLabel,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const where = companyId ? { companyId } : {};

  const docs = await prisma.generatedDocument.findMany({
    where,
    include: { template: { select: { name: true, templateType: true } } },
    orderBy: { generatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ documents: docs });
}
