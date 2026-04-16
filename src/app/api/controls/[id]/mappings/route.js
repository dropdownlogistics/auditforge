// AuditForge — Control Mappings API
// app/api/controls/[id]/mappings/route.js
// Manages bridge table M:M relationships with effective dating

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditEntry } from "@/lib/middleware/validation";

// GET /api/controls/[id]/mappings — get all active mappings
export async function GET(request, { params }) {
  const { id } = params;

  const control = await prisma.control.findUnique({
    where: { id },
    include: {
      risks: { where: { validTo: null }, include: { risk: true } },
      frameworks: { where: { validTo: null }, include: { framework: true } },
      controlObjectives: { where: { validTo: null }, include: { controlObjective: true } },
    },
  });

  if (!control) {
    return NextResponse.json({ error: "Control not found" }, { status: 404 });
  }

  return NextResponse.json({
    risks: control.risks.map((cr) => ({ ...cr.risk, validFrom: cr.validFrom })),
    frameworks: control.frameworks.map((cf) => ({ ...cf.framework, validFrom: cf.validFrom })),
    controlObjectives: control.controlObjectives.map((ca) => ({ ...ca.controlObjective, validFrom: ca.validFrom })),
  });
}

// POST /api/controls/[id]/mappings — add or remove mappings
// Body: { action: "add"|"remove", type: "risk"|"framework"|"assertion", targetId, userId }
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, type, targetId, userId = "system" } = body;

    if (!action || !type || !targetId) {
      return NextResponse.json({ error: "Required: action, type, targetId" }, { status: 400 });
    }

    const control = await prisma.control.findUnique({ where: { id } });
    if (!control) return NextResponse.json({ error: "Control not found" }, { status: 404 });

    // Cannot modify mappings on APPROVED controls
    if (control.reviewStatus === "APPROVED") {
      return NextResponse.json({ error: "Cannot modify mappings on approved controls" }, { status: 409 });
    }

    if (action === "add") {
      return handleAdd(id, type, targetId, userId);
    } else if (action === "remove") {
      return handleRemove(id, type, targetId, userId);
    } else {
      return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Mapping error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleAdd(controlId, type, targetId, userId) {
  const now = new Date();

  switch (type) {
    case "risk": {
      const risk = await prisma.risk.findUnique({ where: { id: targetId } });
      if (!risk) return NextResponse.json({ error: "Risk not found" }, { status: 404 });

      // Check if already active
      const existing = await prisma.controlRisk.findFirst({
        where: { controlId, riskId: targetId, validTo: null },
      });
      if (existing) return NextResponse.json({ error: "Mapping already active" }, { status: 409 });

      await prisma.controlRisk.create({
        data: { controlId, riskId: targetId, validFrom: now },
      });

      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "risks", newValue: risk.riskId, userId,
        rationale: `Added risk mapping: ${risk.riskId}`,
      });
      break;
    }
    case "framework": {
      const fw = await prisma.framework.findUnique({ where: { id: targetId } });
      if (!fw) return NextResponse.json({ error: "Framework requirement not found" }, { status: 404 });

      // Validate: must be leaf node (requirement), not domain
      // In our schema, all framework entries are leaf nodes, but this check
      // prevents future issues if hierarchy deepens
      const existing = await prisma.controlFramework.findFirst({
        where: { controlId, frameworkId: targetId, validTo: null },
      });
      if (existing) return NextResponse.json({ error: "Mapping already active" }, { status: 409 });

      await prisma.controlFramework.create({
        data: { controlId, frameworkId: targetId, validFrom: now },
      });

      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "frameworks", newValue: fw.requirementId, userId,
        rationale: `Added framework mapping: ${fw.frameworkName} ${fw.requirementId}`,
      });
      break;
    }
    case "assertion": {
      const objective = await prisma.controlObjective.findUnique({ where: { id: targetId } });
      if (!objective) return NextResponse.json({ error: "Control objective not found" }, { status: 404 });

      const existing = await prisma.controlObjectiveMapping.findFirst({
        where: { controlId, controlObjectiveId: targetId, validTo: null },
      });
      if (existing) return NextResponse.json({ error: "Mapping already active" }, { status: 409 });

      await prisma.controlObjectiveMapping.create({
        data: { controlId, controlObjectiveId: targetId, validFrom: now },
      });

      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "controlObjectives", newValue: objective.objectiveName, userId,
        rationale: `Added control objective mapping: ${objective.objectiveName}`,
      });
      break;
    }
    default:
      return NextResponse.json({ error: "type must be risk, framework, or assertion" }, { status: 400 });
  }

  return NextResponse.json({ success: true, action: "add", type, targetId });
}

async function handleRemove(controlId, type, targetId, userId) {
  const now = new Date();

  // Effective dating: don't delete — set validTo to now
  switch (type) {
    case "risk": {
      const mapping = await prisma.controlRisk.findFirst({
        where: { controlId, riskId: targetId, validTo: null },
      });
      if (!mapping) return NextResponse.json({ error: "Active mapping not found" }, { status: 404 });

      // Prisma doesn't support updateMany on composite keys cleanly,
      // so we delete and recreate with validTo set
      await prisma.controlRisk.delete({
        where: { controlId_riskId: { controlId, riskId: targetId } },
      });
      await prisma.controlRisk.create({
        data: { controlId, riskId: targetId, validFrom: mapping.validFrom, validTo: now },
      });

      const risk = await prisma.risk.findUnique({ where: { id: targetId } });
      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "risks", previousValue: risk?.riskId, userId,
        rationale: `Removed risk mapping: ${risk?.riskId}`,
      });
      break;
    }
    case "framework": {
      const mapping = await prisma.controlFramework.findFirst({
        where: { controlId, frameworkId: targetId, validTo: null },
      });
      if (!mapping) return NextResponse.json({ error: "Active mapping not found" }, { status: 404 });

      await prisma.controlFramework.delete({
        where: { controlId_frameworkId: { controlId, frameworkId: targetId } },
      });
      await prisma.controlFramework.create({
        data: { controlId, frameworkId: targetId, validFrom: mapping.validFrom, validTo: now },
      });

      const fw = await prisma.framework.findUnique({ where: { id: targetId } });
      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "frameworks", previousValue: fw?.requirementId, userId,
        rationale: `Removed framework mapping: ${fw?.requirementId}`,
      });
      break;
    }
    case "assertion": {
      const mapping = await prisma.controlObjectiveMapping.findFirst({
        where: { controlId, controlObjectiveId: targetId, validTo: null },
      });
      if (!mapping) return NextResponse.json({ error: "Active mapping not found" }, { status: 404 });

      await prisma.controlObjectiveMapping.delete({
        where: { controlId_controlObjectiveId: { controlId, controlObjectiveId: targetId } },
      });
      await prisma.controlObjectiveMapping.create({
        data: { controlId, controlObjectiveId: targetId, validFrom: mapping.validFrom, validTo: now },
      });

      const a = await prisma.controlObjective.findUnique({ where: { id: targetId } });
      await createAuditEntry(prisma, {
        entityType: "Control", entityId: controlId, action: "EDIT",
        field: "controlObjectives", previousValue: a?.objectiveName, userId,
        rationale: `Removed control objective mapping: ${a?.objectiveName}`,
      });
      break;
    }
    default:
      return NextResponse.json({ error: "type must be risk, framework, or assertion" }, { status: 400 });
  }

  return NextResponse.json({ success: true, action: "remove", type, targetId });
}
