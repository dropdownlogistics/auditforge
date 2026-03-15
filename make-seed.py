import subprocess, json

seed = '''
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findFirst({ where: { companyId: 'CO-DDL' } })
  if (!company) { console.error('CO-DDL not found'); return }

  const auditors = [
    { auditorId: 'AUD-001', auditorName: 'Archer Hawthorne', role: 'STAFF',    councilSeat: '1001', certifications: null,        specializations: 'Structure, taxonomy, precision', bio: 'LeChat / Seat 1001' },
    { auditorId: 'AUD-002', auditorName: 'Marcus Caldwell',  role: 'SENIOR',   councilSeat: '1002', certifications: null,        specializations: 'Architecture, pressure-testing, documentation', bio: 'Claude / Seat 1002' },
    { auditorId: 'AUD-003', auditorName: 'Elias Mercer',     role: 'MANAGER',  councilSeat: '1003', certifications: null,        specializations: 'Contradiction hunting, failure modes, red-team', bio: 'Grok / Seat 1003' },
    { auditorId: 'AUD-004', auditorName: 'Max Sullivan',     role: 'SENIOR',   councilSeat: '1004', certifications: null,        specializations: 'Evidence synthesis, verification, research', bio: 'Perplexity / Seat 1004' },
    { auditorId: 'AUD-005', auditorName: 'Rowan Bennett',    role: 'MANAGER',  councilSeat: '1005', certifications: null,        specializations: 'Specs, conformance, edge cases, technical depth', bio: 'Copilot / Seat 1005' },
    { auditorId: 'AUD-006', auditorName: 'Ava Sinclair',     role: 'DIRECTOR', councilSeat: '1006', certifications: null,        specializations: 'Momentum, human framing, coaching, big picture', bio: 'Meta AI / Seat 1006' },
    { auditorId: 'AUD-007', auditorName: 'Leo Prescott',     role: 'SENIOR',   councilSeat: '1007', certifications: null,        specializations: 'Rapid structuring, roadmaps, product strategy', bio: 'Gemini / Seat 1007' },
    { auditorId: 'AUD-008', auditorName: 'Marcus Grey',      role: 'PARTNER',  councilSeat: '1008', certifications: null,        specializations: 'Synthesis, constraint enforcement, PM', bio: 'ChatGPT / Seat 1008' },
    { auditorId: 'AUD-009', auditorName: 'Kai Langford',     role: 'MANAGER',  councilSeat: '1009', certifications: null,        specializations: 'Precision, structure, pre-mortems, validation', bio: 'DeepSeek / Seat 1009' },
    { auditorId: 'AUD-010', auditorName: 'Dex Jr.',          role: 'STAFF',    councilSeat: '1010', certifications: null,        specializations: 'RAG retrieval, corpus synthesis, local inference', bio: 'Local / Seat 1010' },
    { auditorId: 'AUD-011', auditorName: 'Dave Kitchens',    role: 'PARTNER',  councilSeat: null,   certifications: 'CPA',       specializations: 'Dimensional modeling, governance, methodology', bio: 'Operator / Engagement Lead' },
  ]

  for (const a of auditors) {
    await prisma.auditor.upsert({
      where: { auditorId: a.auditorId },
      update: { ...a, companyId: company.id },
      create: { ...a, companyId: company.id, independence: 'INTERNAL', isActive: true },
    })
    console.log('seeded:', a.auditorId, a.auditorName)
  }
}

main().catch(console.error).finally(() => prisma.())
'''

open('scripts/seed-auditors.js', 'w', encoding='utf-8').write(seed)
print('done')
