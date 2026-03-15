const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const audit = await prisma.audit.findFirst({ where: { companyId: (await prisma.company.findFirst({ where: { companyId: 'CO-DDL' } })).id } })
  if (!audit) { console.error('No audit found'); return }
  console.log('Staffing audit:', audit.auditId, audit.auditName)

  const team = [
    { auditorId: 'AUD-011', teamRole: 'PARTNER',  budgetHours: 40,  assignedPhase: 'ALL' },
    { auditorId: 'AUD-008', teamRole: 'PARTNER',  budgetHours: 20,  assignedPhase: 'REPORTING' },
    { auditorId: 'AUD-006', teamRole: 'REVIEWER', budgetHours: 16,  assignedPhase: 'REPORTING' },
    { auditorId: 'AUD-003', teamRole: 'MANAGER',  budgetHours: 30,  assignedPhase: 'ALL' },
    { auditorId: 'AUD-005', teamRole: 'MANAGER',  budgetHours: 24,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-009', teamRole: 'MANAGER',  budgetHours: 24,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-002', teamRole: 'SENIOR',   budgetHours: 32,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-004', teamRole: 'SENIOR',   budgetHours: 32,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-007', teamRole: 'SENIOR',   budgetHours: 28,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-001', teamRole: 'STAFF',    budgetHours: 40,  assignedPhase: 'FIELDWORK' },
    { auditorId: 'AUD-010', teamRole: 'STAFF',    budgetHours: 40,  assignedPhase: 'FIELDWORK' },
  ]

  for (const t of team) {
    const auditor = await prisma.auditor.findUnique({ where: { auditorId: t.auditorId } })
    if (!auditor) { console.log('skipping', t.auditorId); continue }
    await prisma.auditAuditor.upsert({
      where: { auditId_auditorId: { auditId: audit.id, auditorId: auditor.id } },
      update: { teamRole: t.teamRole, budgetHours: t.budgetHours, assignedPhase: t.assignedPhase },
      create: { auditId: audit.id, auditorId: auditor.id, teamRole: t.teamRole, budgetHours: t.budgetHours, assignedPhase: t.assignedPhase },
    })
    console.log('staffed:', t.auditorId, auditor.auditorName, t.teamRole)
  }
}

main().catch(console.error).finally(() => prisma['']())
