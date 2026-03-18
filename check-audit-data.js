const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })
  
  const audits = await prisma.audit.findMany({
    where: { companyId: company.id },
    include: {
      leadAuditor: { select: { auditorName: true, role: true } },
      period: { select: { periodLabel: true } },
      team: {
        include: { auditor: { select: { auditorName: true, role: true } } }
      },
      controlScope: {
        where: { validTo: null },
        include: { control: { select: { controlId: true, keyControl: true, reviewStatus: true, process: { select: { processArea: true } } } } }
      }
    }
  })

  audits.forEach(a => {
    const inScope = a.controlScope.filter(s => s.inScope)
    const totalHours = a.team.reduce((s, t) => s + (t.budgetHours || 0), 0)
    console.log(a.auditId, '|', a.status, '|', a.auditName.substring(0, 40))
    console.log('  Team:', a.team.length, 'members |', totalHours + 'h budget')
    console.log('  Scope:', inScope.length, 'controls |', a.startDate?.toISOString().split('T')[0], '->', a.endDate?.toISOString().split('T')[0])
    console.log('  Lead:', a.leadAuditor?.auditorName)
    console.log()
  })
}

main().catch(console.error).finally(() => prisma['']())
