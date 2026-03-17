content = '''
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })
  
  const processes = await prisma.process.findMany({
    where: { companyId: company.id },
    include: { controls: { select: { id: true } } }
  })

  console.log('Total processes:', processes.length)
  
  const byArea = {}
  for (const p of processes) {
    if (!byArea[p.processArea]) byArea[p.processArea] = []
    byArea[p.processArea].push(p)
  }

  console.log('Unique process areas:', Object.keys(byArea).length)
  for (const [area, procs] of Object.entries(byArea)) {
    const ctrlCount = procs.reduce((a,p) => a + p.controls.length, 0)
    console.log('  ' + area + ': ' + procs.length + ' processes, ' + ctrlCount + ' controls')
  }
}

main().catch(console.error).finally(() => prisma['']())
'''
open('check-procs.js', 'w', encoding='utf-8').write(content)
print('done')
