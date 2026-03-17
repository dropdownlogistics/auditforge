content = '''
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })
  if (!company) throw new Error('Company CO-DDL not found')

  const period = await prisma.period.findFirst({
    where: { companyId: company.id },
    orderBy: { periodLabel: 'desc' }
  })
  if (!period) throw new Error('No period found')

  console.log('Company:', company.companyId, '| Period:', period.periodLabel)

  // Helper to find auditor by auditorId
  async function findAuditor(auditorId) {
    const a = await prisma.auditor.findFirst({ where: { companyId: company.id, auditorId } })
    if (!a) throw new Error('Auditor not found: ' + auditorId)
    return a
  }

  // Helper to find all controls in process areas
  async function findControlsByAreas(areas) {
    const processes = await prisma.process.findMany({
      where: { companyId: company.id, processArea: { in: areas } }
    })
    const processIds = processes.map(p => p.id)
    return await prisma.control.findMany({
      where: { companyId: company.id, processId: { in: processIds } }
    })
  }

  // ── ENGAGEMENT 1 — Technology and Infrastructure Review ──────
  console.log('\\nSeeding AUD-2025-002...')
  {
    const lead = await findAuditor('AUD-011')

    const existing = await prisma.audit.findUnique({ where: { auditId: 'AUD-2025-002' } })
    let audit
    if (existing) {
      audit = await prisma.audit.update({
        where: { id: existing.id },
        data: {
          auditName: 'Technology and Infrastructure Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-02-03'),
          endDate: new Date('2025-04-11'),
          scope: 'End-to-end review of DDL technical control environment covering IT General Controls, Operations and Change Management, and Data Governance and AI Integrity. Priority focus on local AI infrastructure governance, deployment pipeline integrity, and corpus access controls.',
          methodology: 'This engagement applies a risk-stratified approach beginning with walkthroughs of DDL deployment pipeline (GitHub to Vercel), local AI infrastructure (Ollama Modelfile governance, ChromaDB corpus integrity), and access controls across all three process areas. Fieldwork prioritizes key controls first — particularly those governing model version deployment, corpus constitutional hierarchy enforcement, and secret management — before moving to detective and monitoring controls. The AI Integrity process area will be tested using both documentary evidence review and live system validation given the absence of established audit precedent for RAG pipeline controls.',
        }
      })
      console.log('  Updated audit')
    } else {
      audit = await prisma.audit.create({
        data: {
          auditId: 'AUD-2025-002',
          companyId: company.id,
          periodId: period.id,
          auditName: 'Technology and Infrastructure Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-02-03'),
          endDate: new Date('2025-04-11'),
          scope: 'End-to-end review of DDL technical control environment covering IT General Controls, Operations and Change Management, and Data Governance and AI Integrity. Priority focus on local AI infrastructure governance, deployment pipeline integrity, and corpus access controls.',
          methodology: 'This engagement applies a risk-stratified approach beginning with walkthroughs of DDL deployment pipeline (GitHub to Vercel), local AI infrastructure (Ollama Modelfile governance, ChromaDB corpus integrity), and access controls across all three process areas. Fieldwork prioritizes key controls first — particularly those governing model version deployment, corpus constitutional hierarchy enforcement, and secret management — before moving to detective and monitoring controls. The AI Integrity process area will be tested using both documentary evidence review and live system validation given the absence of established audit precedent for RAG pipeline controls.',
        }
      })
      console.log('  Created audit')
    }

    // Team
    const team1 = [
      { auditorId: 'AUD-011', teamRole: 'ENGAGEMENT_LEAD', assignedPhase: 'ALL', budgetHours: 12 },
      { auditorId: 'AUD-001', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'AUD-007', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-009', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'ITGC-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 28 },
      { auditorId: 'OPS-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 26 },
      { auditorId: 'DGA-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 27 },
      { auditorId: 'ITGC-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 38 },
      { auditorId: 'OPS-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 36 },
      { auditorId: 'DGA-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 38 },
      { auditorId: 'ITGC-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 52 },
      { auditorId: 'ITGC-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 48 },
      { auditorId: 'OPS-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 50 },
      { auditorId: 'DGA-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 46 },
      { auditorId: 'DGA-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 44 },
    ]
    await prisma.auditAuditor.deleteMany({ where: { auditId: audit.id } })
    for (const m of team1) {
      const auditor = await findAuditor(m.auditorId)
      await prisma.auditAuditor.create({
        data: { auditId: audit.id, auditorId: auditor.id, teamRole: m.teamRole, assignedPhase: m.assignedPhase, budgetHours: m.budgetHours }
      })
    }
    console.log('  Seeded', team1.length, 'team members')

    // Controls in scope
    const controls1 = await findControlsByAreas(['IT General Controls', 'Operations and Change Management', 'Data Governance and AI Integrity'])
    await prisma.auditControlScope.deleteMany({ where: { auditId: audit.id } })
    for (const ctrl of controls1) {
      await prisma.auditControlScope.create({
        data: { auditId: audit.id, controlId: ctrl.id, inScope: true, scopeDecision: 'IN_SCOPE' }
      })
    }
    console.log('  Scoped', controls1.length, 'controls')
  }

  // ── ENGAGEMENT 2 — Governance and Compliance Review ──────────
  console.log('\\nSeeding AUD-2025-003...')
  {
    const lead = await findAuditor('AUD-002')

    const existing = await prisma.audit.findUnique({ where: { auditId: 'AUD-2025-003' } })
    let audit
    if (existing) {
      audit = await prisma.audit.update({
        where: { id: existing.id },
        data: {
          auditName: 'Governance and Compliance Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-04-28'),
          endDate: new Date('2025-06-27'),
          scope: 'Structured review of DDL internal governance framework, ethical obligations, and workforce controls. Covers Governance and Oversight, Communications and Ethics, and HR and Workforce Governance. Particular focus on council ratification integrity, manifest currency, publication governance, and contractor lifecycle controls.',
          methodology: 'The engagement opens with a standards registry completeness review and manifest currency check to establish whether the governance documentation layer is coherent before testing individual controls. Governance and Oversight fieldwork focuses on ADR immutability, council ratification protocols, and audit trail integrity. Communications and Ethics testing centers on pre-publication approval workflows and conflict of interest disclosures. HR fieldwork covers the contractor lifecycle from identity verification through offboarding, with emphasis on IP assignment documentation and access recertification completeness.',
        }
      })
      console.log('  Updated audit')
    } else {
      audit = await prisma.audit.create({
        data: {
          auditId: 'AUD-2025-003',
          companyId: company.id,
          periodId: period.id,
          auditName: 'Governance and Compliance Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-04-28'),
          endDate: new Date('2025-06-27'),
          scope: 'Structured review of DDL internal governance framework, ethical obligations, and workforce controls. Covers Governance and Oversight, Communications and Ethics, and HR and Workforce Governance. Particular focus on council ratification integrity, manifest currency, publication governance, and contractor lifecycle controls.',
          methodology: 'The engagement opens with a standards registry completeness review and manifest currency check to establish whether the governance documentation layer is coherent before testing individual controls. Governance and Oversight fieldwork focuses on ADR immutability, council ratification protocols, and audit trail integrity. Communications and Ethics testing centers on pre-publication approval workflows and conflict of interest disclosures. HR fieldwork covers the contractor lifecycle from identity verification through offboarding, with emphasis on IP assignment documentation and access recertification completeness.',
        }
      })
      console.log('  Created audit')
    }

    const team2 = [
      { auditorId: 'AUD-002', teamRole: 'ENGAGEMENT_LEAD', assignedPhase: 'ALL', budgetHours: 13 },
      { auditorId: 'AUD-011', teamRole: 'DIRECTOR', assignedPhase: 'REPORTING', budgetHours: 10 },
      { auditorId: 'AUD-005', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-006', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 9 },
      { auditorId: 'GOV-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 27 },
      { auditorId: 'HR-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 25 },
      { auditorId: 'COMM-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 24 },
      { auditorId: 'GOV-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 37 },
      { auditorId: 'HR-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 35 },
      { auditorId: 'COMM-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 34 },
      { auditorId: 'GOV-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 54 },
      { auditorId: 'GOV-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 48 },
      { auditorId: 'HR-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 44 },
      { auditorId: 'COMM-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 42 },
      { auditorId: 'COMM-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 40 },
    ]
    await prisma.auditAuditor.deleteMany({ where: { auditId: audit.id } })
    for (const m of team2) {
      const auditor = await findAuditor(m.auditorId)
      await prisma.auditAuditor.create({
        data: { auditId: audit.id, auditorId: auditor.id, teamRole: m.teamRole, assignedPhase: m.assignedPhase, budgetHours: m.budgetHours }
      })
    }
    console.log('  Seeded', team2.length, 'team members')

    const controls2 = await findControlsByAreas(['Governance and Oversight', 'Communications and Ethics', 'HR and Workforce Governance'])
    await prisma.auditControlScope.deleteMany({ where: { auditId: audit.id } })
    for (const ctrl of controls2) {
      await prisma.auditControlScope.create({
        data: { auditId: audit.id, controlId: ctrl.id, inScope: true, scopeDecision: 'IN_SCOPE' }
      })
    }
    console.log('  Scoped', controls2.length, 'controls')
  }

  // ── ENGAGEMENT 3 — Financial Integrity Review ────────────────
  console.log('\\nSeeding AUD-2025-004...')
  {
    const lead = await findAuditor('AUD-003')

    const existing = await prisma.audit.findUnique({ where: { auditId: 'AUD-2025-004' } })
    let audit
    if (existing) {
      audit = await prisma.audit.update({
        where: { id: existing.id },
        data: {
          auditName: 'Financial Integrity Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-07-07'),
          endDate: new Date('2025-09-05'),
          scope: 'Revenue accuracy, commission integrity, and third-party financial risk across Financial Reporting and Revenue, Revenue Integrity and Commissions, and Vendor and Third-Party Management. Focus on whether DDL revenue recognition, commission payout logic, and vendor cost governance are operating as designed and producing defensible auditable outputs.',
          methodology: 'The engagement begins with a source-to-output population reconciliation across all three process areas — billing records to recognized revenue, revenue to commission payout, and contracted vendor commitments to actual costs — before any individual control testing begins. This population integrity check determines whether the data layer is reliable enough to support the controls that depend on it. Revenue recognition cut-off testing, commission formula integrity sampling, and vendor SLA monitoring validation are the highest-priority fieldwork areas.',
        }
      })
      console.log('  Updated audit')
    } else {
      audit = await prisma.audit.create({
        data: {
          auditId: 'AUD-2025-004',
          companyId: company.id,
          periodId: period.id,
          auditName: 'Financial Integrity Review — FY2025',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-07-07'),
          endDate: new Date('2025-09-05'),
          scope: 'Revenue accuracy, commission integrity, and third-party financial risk across Financial Reporting and Revenue, Revenue Integrity and Commissions, and Vendor and Third-Party Management. Focus on whether DDL revenue recognition, commission payout logic, and vendor cost governance are operating as designed and producing defensible auditable outputs.',
          methodology: 'The engagement begins with a source-to-output population reconciliation across all three process areas — billing records to recognized revenue, revenue to commission payout, and contracted vendor commitments to actual costs — before any individual control testing begins. This population integrity check determines whether the data layer is reliable enough to support the controls that depend on it. Revenue recognition cut-off testing, commission formula integrity sampling, and vendor SLA monitoring validation are the highest-priority fieldwork areas.',
        }
      })
      console.log('  Created audit')
    }

    const team3 = [
      { auditorId: 'AUD-003', teamRole: 'ENGAGEMENT_LEAD', assignedPhase: 'ALL', budgetHours: 14 },
      { auditorId: 'AUD-011', teamRole: 'DIRECTOR', assignedPhase: 'REPORTING', budgetHours: 10 },
      { auditorId: 'AUD-008', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'AUD-004', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'FIN-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 29 },
      { auditorId: 'RI-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 27 },
      { auditorId: 'VND-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 25 },
      { auditorId: 'FIN-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 38 },
      { auditorId: 'RI-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 37 },
      { auditorId: 'VND-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 35 },
      { auditorId: 'FIN-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 56 },
      { auditorId: 'FIN-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 50 },
      { auditorId: 'RI-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 52 },
      { auditorId: 'RI-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 48 },
      { auditorId: 'VND-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 44 },
    ]
    await prisma.auditAuditor.deleteMany({ where: { auditId: audit.id } })
    for (const m of team3) {
      const auditor = await findAuditor(m.auditorId)
      await prisma.auditAuditor.create({
        data: { auditId: audit.id, auditorId: auditor.id, teamRole: m.teamRole, assignedPhase: m.assignedPhase, budgetHours: m.budgetHours }
      })
    }
    console.log('  Seeded', team3.length, 'team members')

    const controls3 = await findControlsByAreas(['Financial Reporting and Revenue', 'Revenue Integrity and Commissions', 'Vendor and Third-Party Management'])
    await prisma.auditControlScope.deleteMany({ where: { auditId: audit.id } })
    for (const ctrl of controls3) {
      await prisma.auditControlScope.create({
        data: { auditId: audit.id, controlId: ctrl.id, inScope: true, scopeDecision: 'IN_SCOPE' }
      })
    }
    console.log('  Scoped', controls3.length, 'controls')
  }

  // ── ENGAGEMENT 4 — Annual CAE Review (carry forward) ─────────
  console.log('\\nSeeding AUD-2025-001...')
  {
    const lead = await findAuditor('AUD-011')

    const existing = await prisma.audit.findUnique({ where: { auditId: 'AUD-2025-001' } })
    let audit
    if (existing) {
      audit = await prisma.audit.update({
        where: { id: existing.id },
        data: {
          auditName: 'Annual CAE Review — FY2025 Full Universe',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-09-22'),
          endDate: new Date('2025-12-19'),
          scope: 'Full-universe review of all 106 DDL controls across all 9 process areas. This is the annual CAE-level review that synthesizes findings from earlier engagements, closes open items, and produces the definitive governance state assessment for FY2025.',
          methodology: 'The Annual CAE Review operates as an integrative engagement — it does not re-perform the detailed fieldwork from AUD-2025-002, -003, and -004, but instead validates that all prior findings were addressed, tests the subset of controls not covered in domain engagements, and produces the FY2025 control environment opinion at the program level. Each Director is responsible for testing and conclusions in their respective process area. The engagement closes with a formal program-level deliverable suitable for operator sign-off and external stakeholder review.',
        }
      })
      console.log('  Updated audit')
    } else {
      audit = await prisma.audit.create({
        data: {
          auditId: 'AUD-2025-001',
          companyId: company.id,
          periodId: period.id,
          auditName: 'Annual CAE Review — FY2025 Full Universe',
          auditType: 'INTERNAL',
          status: 'PLANNING',
          leadAuditorId: lead.id,
          startDate: new Date('2025-09-22'),
          endDate: new Date('2025-12-19'),
          scope: 'Full-universe review of all 106 DDL controls across all 9 process areas. This is the annual CAE-level review that synthesizes findings from earlier engagements, closes open items, and produces the definitive governance state assessment for FY2025.',
          methodology: 'The Annual CAE Review operates as an integrative engagement — it does not re-perform the detailed fieldwork from AUD-2025-002, -003, and -004, but instead validates that all prior findings were addressed, tests the subset of controls not covered in domain engagements, and produces the FY2025 control environment opinion at the program level. Each Director is responsible for testing and conclusions in their respective process area. The engagement closes with a formal program-level deliverable suitable for operator sign-off and external stakeholder review.',
        }
      })
      console.log('  Created audit')
    }

    const team4 = [
      { auditorId: 'AUD-011', teamRole: 'ENGAGEMENT_LEAD', assignedPhase: 'ALL', budgetHours: 15 },
      { auditorId: 'AUD-002', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 12 },
      { auditorId: 'AUD-001', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'AUD-003', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'AUD-004', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-005', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-006', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-007', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 10 },
      { auditorId: 'AUD-008', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'AUD-009', teamRole: 'DIRECTOR', assignedPhase: 'ALL', budgetHours: 11 },
      { auditorId: 'GOV-MGR-001', teamRole: 'MANAGER', assignedPhase: 'ALL', budgetHours: 28 },
      { auditorId: 'ITGC-MGR-001', teamRole: 'MANAGER', assignedPhase: 'FIELDWORK', budgetHours: 26 },
      { auditorId: 'FIN-MGR-001', teamRole: 'MANAGER', assignedPhase: 'FIELDWORK', budgetHours: 25 },
      { auditorId: 'DGA-MGR-001', teamRole: 'MANAGER', assignedPhase: 'FIELDWORK', budgetHours: 26 },
      { auditorId: 'RI-MGR-001', teamRole: 'MANAGER', assignedPhase: 'FIELDWORK', budgetHours: 24 },
      { auditorId: 'GOV-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 38 },
      { auditorId: 'ITGC-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 36 },
      { auditorId: 'DGA-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 37 },
      { auditorId: 'FIN-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 35 },
      { auditorId: 'RI-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 35 },
      { auditorId: 'OPS-SR-001', teamRole: 'SENIOR', assignedPhase: 'FIELDWORK', budgetHours: 34 },
      { auditorId: 'GOV-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 52 },
      { auditorId: 'GOV-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 48 },
      { auditorId: 'ITGC-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 46 },
      { auditorId: 'DGA-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 48 },
      { auditorId: 'RI-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 50 },
      { auditorId: 'FIN-STF-001', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 46 },
      { auditorId: 'OPS-STF-002', teamRole: 'STAFF', assignedPhase: 'FIELDWORK', budgetHours: 44 },
    ]
    await prisma.auditAuditor.deleteMany({ where: { auditId: audit.id } })
    for (const m of team4) {
      const auditor = await findAuditor(m.auditorId)
      await prisma.auditAuditor.create({
        data: { auditId: audit.id, auditorId: auditor.id, teamRole: m.teamRole, assignedPhase: m.assignedPhase, budgetHours: m.budgetHours }
      })
    }
    console.log('  Seeded', team4.length, 'team members')

    // All 9 process areas
    const allAreas = [
      'IT General Controls', 'Governance and Oversight', 'Financial Reporting and Revenue',
      'Vendor and Third-Party Management', 'HR and Workforce Governance', 'Communications and Ethics',
      'Operations and Change Management', 'Revenue Integrity and Commissions', 'Data Governance and AI Integrity'
    ]
    const controls4 = await findControlsByAreas(allAreas)
    await prisma.auditControlScope.deleteMany({ where: { auditId: audit.id } })
    for (const ctrl of controls4) {
      await prisma.auditControlScope.create({
        data: { auditId: audit.id, controlId: ctrl.id, inScope: true, scopeDecision: 'IN_SCOPE' }
      })
    }
    console.log('  Scoped', controls4.length, 'controls')
  }

  console.log('\\nDone. 4 engagements seeded.')
}

main().catch(console.error).finally(() => prisma["$disconnect"]())
'''
open('seed-engagements.js', 'w', encoding='utf-8').write(content)
print('done')
