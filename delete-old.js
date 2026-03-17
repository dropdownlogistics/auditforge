const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const oldIds = ['CTRL-TEST-001','CTRL-CTX-001','CTRL-CTX-002','CTRL-CTX-003',
    'CTRL-TEST-003','CTRL-GOV-001','CTRL-HAB-001','CTRL-HAB-002','CTRL-HAB-003',
    'CTRL-TEST-004','CTRL-TEST-002','CTRL-PRO-001','CTRL-PRO-002','CTRL-PRO-003',
    'CTRL-PRO-004']

  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })

  const controls = await prisma.control.findMany({
    where: { companyId: company.id, controlId: { in: oldIds } }
  })
  const ids = controls.map(c => c.id)
  console.log('Found:', ids.length, 'controls')

  // Delete bridge records first
  const bridge = await prisma.auditControlScope.deleteMany({
    where: { controlId: { in: ids } }
  })
  console.log('Deleted bridge records:', bridge.count)

  // Delete status logs
  const logs = await prisma.controlStatusLog.deleteMany({
    where: { controlId: { in: ids } }
  })
  console.log('Deleted status logs:', logs.count)

  // Now delete controls
  const result = await prisma.control.deleteMany({
    where: { id: { in: ids } }
  })
  console.log('Deleted controls:', result.count)
}

main().catch(console.error).finally(() => prisma['']())
