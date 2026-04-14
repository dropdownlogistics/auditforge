import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const controls = await prisma.control.findMany({
    where: { companyId: resolved },
    select: {
      id: true,
      controlId: true,
      description: true,
      designEffectiveness: true,
      operatingEffectiveness: true,
    },
  });

  const EMPTY = { EFFECTIVE: 0, PARTIALLY_EFFECTIVE: 0, INEFFECTIVE: 0, NOT_TESTED: 0 };
  const design = { ...EMPTY };
  const operating = { ...EMPTY };
  const dualIneffective = [];

  for (const c of controls) {
    design[c.designEffectiveness] = (design[c.designEffectiveness] || 0) + 1;
    operating[c.operatingEffectiveness] = (operating[c.operatingEffectiveness] || 0) + 1;
    if (c.designEffectiveness === "INEFFECTIVE" && c.operatingEffectiveness === "INEFFECTIVE") {
      dualIneffective.push({ id: c.id, controlId: c.controlId, description: c.description });
    }
  }

  return NextResponse.json({
    total: controls.length,
    design,
    operating,
    dualIneffective,
    dualIneffectiveCount: dualIneffective.length,
  });
}
