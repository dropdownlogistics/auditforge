content = '''
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })

  const processes = await prisma.process.findMany({
    where: { companyId: company.id },
    include: { controls: { select: { id: true } } }
  })

  // Step 1: Delete orphans (0 controls)
  const orphans = processes.filter(p => p.controls.length === 0)
  const orphanIds = orphans.map(p => p.id)
  const del1 = await prisma.process.deleteMany({ where: { id: { in: orphanIds } } })
  console.log('Deleted orphan processes:', del1.count)

  // Step 2: For each area with multiple processes, keep one, reassign controls
  const active = processes.filter(p => p.controls.length > 0)
  const byArea = {}
  for (const p of active) {
    if (!byArea[p.processArea]) byArea[p.processArea] = []
    byArea[p.processArea].push(p)
  }

  let reassigned = 0
  let deleted = 0

  for (const [area, procs] of Object.entries(byArea)) {
    if (procs.length <= 1) continue
    const keeper = procs[0]
    const others = procs.slice(1)
    const otherIds = others.map(p => p.id)
    const controlIds = others.flatMap(p => p.controls.map(c => c.id))

    // Reassign controls to keeper
    await prisma.control.updateMany({
      where: { id: { in: controlIds } },
      data: { processId: keeper.id }
    })
    reassigned += controlIds.length

    // Delete duplicate processes
    const del2 = await prisma.process.deleteMany({ where: { id: { in: otherIds } } })
    deleted += del2.count
    console.log('  ' + area + ': kept ' + keeper.processId + ', reassigned ' + controlIds.length + ' controls, deleted ' + del2.count + ' processes')
  }

  console.log('Total reassigned:', reassigned, '| Total deleted:', deleted)

  const final = await prisma.process.count({ where: { companyId: company.id } })
  console.log('Final process count:', final)
}

main().catch(console.error).finally(() => prisma['']())
'''
open('fix-procs.js', 'w', encoding='utf-8').write(content)
print('done')
