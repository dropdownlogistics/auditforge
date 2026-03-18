content = '''
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// STD-AUDITOR-001 Token Assignments
// Strengths: STR-01 through STR-08
// Weaknesses: WKS-01 through WKS-08

const assignments = [
  // ── DIRECTORS ─────────────────────────────────────────────────
  // AUD-001 Archer Hawthorne — ITGC
  { auditorId: 'AUD-001', strengthTokens: 'STR-02,STR-06,STR-07', weaknessTokens: 'WKS-05,WKS-08' },
  // AUD-002 Marcus Caldwell — Governance
  { auditorId: 'AUD-002', strengthTokens: 'STR-07,STR-05,STR-08', weaknessTokens: 'WKS-04,WKS-08' },
  // AUD-003 Elias Mercer — Financial
  { auditorId: 'AUD-003', strengthTokens: 'STR-06,STR-01,STR-08', weaknessTokens: 'WKS-07,WKS-08' },
  // AUD-004 Max Sullivan — Vendor
  { auditorId: 'AUD-004', strengthTokens: 'STR-05,STR-07,STR-03', weaknessTokens: 'WKS-04,WKS-03' },
  // AUD-005 Rowan Bennett — HR
  { auditorId: 'AUD-005', strengthTokens: 'STR-07,STR-03,STR-08', weaknessTokens: 'WKS-08,WKS-02' },
  // AUD-006 Ava Sinclair — Communications
  { auditorId: 'AUD-006', strengthTokens: 'STR-03,STR-05,STR-08', weaknessTokens: 'WKS-02,WKS-04' },
  // AUD-007 Leo Prescott — OCM
  { auditorId: 'AUD-007', strengthTokens: 'STR-07,STR-05,STR-06', weaknessTokens: 'WKS-08' },
  // AUD-008 Marcus Grey — Revenue Integrity
  { auditorId: 'AUD-008', strengthTokens: 'STR-07,STR-05,STR-08', weaknessTokens: 'WKS-07,WKS-08' },
  // AUD-009 Kai Langford — DAI
  { auditorId: 'AUD-009', strengthTokens: 'STR-02,STR-07,STR-01', weaknessTokens: 'WKS-01,WKS-05' },
  // AUD-011 Dave Kitchens — CAE
  { auditorId: 'AUD-011', strengthTokens: 'STR-08,STR-07,STR-03', weaknessTokens: 'WKS-04' },

  // ── ITGC Team ─────────────────────────────────────────────────
  // ITGC-MGR-001 Priya Desai
  { auditorId: 'ITGC-MGR-001', strengthTokens: 'STR-01,STR-03,STR-06', weaknessTokens: 'WKS-08,WKS-01' },
  // ITGC-SR-001 Daniel Carter
  { auditorId: 'ITGC-SR-001', strengthTokens: 'STR-02,STR-05,STR-03', weaknessTokens: 'WKS-03,WKS-07' },
  // ITGC-STF-001 Sophie Nguyen
  { auditorId: 'ITGC-STF-001', strengthTokens: 'STR-06,STR-03', weaknessTokens: 'WKS-08,WKS-04' },
  // ITGC-STF-002 Ryan Patel
  { auditorId: 'ITGC-STF-002', strengthTokens: 'STR-05,STR-04', weaknessTokens: 'WKS-08,WKS-01' },

  // ── GOV Team ──────────────────────────────────────────────────
  // GOV-MGR-001 Nadia Okafor
  { auditorId: 'GOV-MGR-001', strengthTokens: 'STR-04,STR-03,STR-08', weaknessTokens: 'WKS-06,WKS-02' },
  // GOV-SR-001 Thomas Wyatt
  { auditorId: 'GOV-SR-001', strengthTokens: 'STR-01,STR-06,STR-05', weaknessTokens: 'WKS-05,WKS-08' },
  // GOV-STF-001 Rachel Tseng
  { auditorId: 'GOV-STF-001', strengthTokens: 'STR-04,STR-01', weaknessTokens: 'WKS-08,WKS-06' },
  // GOV-STF-002 Derek Langham
  { auditorId: 'GOV-STF-002', strengthTokens: 'STR-05,STR-01', weaknessTokens: 'WKS-05,WKS-06' },

  // ── FIN Team ──────────────────────────────────────────────────
  // FIN-MGR-001 Lauren Whitaker
  { auditorId: 'FIN-MGR-001', strengthTokens: 'STR-03,STR-04,STR-01', weaknessTokens: 'WKS-04,WKS-05' },
  // FIN-SR-001 Marcus Delgado
  { auditorId: 'FIN-SR-001', strengthTokens: 'STR-02,STR-03,STR-01', weaknessTokens: 'WKS-03,WKS-02' },
  // FIN-STF-001 Sarah Chen
  { auditorId: 'FIN-STF-001', strengthTokens: 'STR-01,STR-04', weaknessTokens: 'WKS-07,WKS-06' },
  // FIN-STF-002 Tyler Nguyen
  { auditorId: 'FIN-STF-002', strengthTokens: 'STR-05,STR-04', weaknessTokens: 'WKS-06,WKS-02' },

  // ── VND Team ──────────────────────────────────────────────────
  // VND-MGR-001 Elena Vasquez
  { auditorId: 'VND-MGR-001', strengthTokens: 'STR-03,STR-05,STR-04', weaknessTokens: 'WKS-02,WKS-08' },
  // VND-SR-001 Raj Patel
  { auditorId: 'VND-SR-001', strengthTokens: 'STR-02,STR-01,STR-07', weaknessTokens: 'WKS-01,WKS-06' },
  // VND-STF-001 Sophia Chen
  { auditorId: 'VND-STF-001', strengthTokens: 'STR-05,STR-01', weaknessTokens: 'WKS-06,WKS-08' },
  // VND-STF-002 Liam O\'Connor
  { auditorId: "VND-STF-002", strengthTokens: 'STR-04,STR-01', weaknessTokens: 'WKS-05,WKS-01' },

  // ── HR Team ───────────────────────────────────────────────────
  // HR-MGR-001 Priya Nair
  { auditorId: 'HR-MGR-001', strengthTokens: 'STR-04,STR-07,STR-03', weaknessTokens: 'WKS-08,WKS-04' },
  // HR-SR-001 Marcus Li
  { auditorId: 'HR-SR-001', strengthTokens: 'STR-01,STR-08,STR-06', weaknessTokens: 'WKS-07,WKS-01' },
  // HR-STF-001 Elena Garcia
  { auditorId: 'HR-STF-001', strengthTokens: 'STR-04,STR-01', weaknessTokens: 'WKS-06,WKS-08' },
  // HR-STF-002 Jonah Park
  { auditorId: 'HR-STF-002', strengthTokens: 'STR-04,STR-01', weaknessTokens: 'WKS-08,WKS-02' },

  // ── COMM Team ─────────────────────────────────────────────────
  // COMM-MGR-001 Elena Vance
  { auditorId: 'COMM-MGR-001', strengthTokens: 'STR-07,STR-04,STR-03', weaknessTokens: 'WKS-04,WKS-08' },
  // COMM-SR-001 Samuel Jones
  { auditorId: 'COMM-SR-001', strengthTokens: 'STR-01,STR-02,STR-05', weaknessTokens: 'WKS-05,WKS-04' },
  // COMM-STF-001 Chloe Kim
  { auditorId: 'COMM-STF-001', strengthTokens: 'STR-01,STR-04', weaknessTokens: 'WKS-06,WKS-02' },
  // COMM-STF-002 Ben Carter
  { auditorId: 'COMM-STF-002', strengthTokens: 'STR-03,STR-05', weaknessTokens: 'WKS-04,WKS-07' },

  // ── OCM Team ──────────────────────────────────────────────────
  // OPS-MGR-001 Julian Vance
  { auditorId: 'OPS-MGR-001', strengthTokens: 'STR-05,STR-03,STR-08', weaknessTokens: 'WKS-01,WKS-07' },
  // OPS-SR-001 Clara Hayes
  { auditorId: 'OPS-SR-001', strengthTokens: 'STR-01,STR-06,STR-04', weaknessTokens: 'WKS-08,WKS-05' },
  // OPS-STF-001 David Chen
  { auditorId: 'OPS-STF-001', strengthTokens: 'STR-04,STR-02', weaknessTokens: 'WKS-08,WKS-05' },
  // OPS-STF-002 Maya Robinson
  { auditorId: 'OPS-STF-002', strengthTokens: 'STR-06,STR-03', weaknessTokens: 'WKS-04,WKS-01' },

  // ── RI Team ───────────────────────────────────────────────────
  // RI-MGR-001 Natalie Voss
  { auditorId: 'RI-MGR-001', strengthTokens: 'STR-08,STR-05,STR-04', weaknessTokens: 'WKS-03,WKS-08' },
  // RI-SR-001 Daniel Mercer
  { auditorId: 'RI-SR-001', strengthTokens: 'STR-01,STR-05,STR-06', weaknessTokens: 'WKS-06,WKS-07' },
  // RI-STF-001 Priya Holloway
  { auditorId: 'RI-STF-001', strengthTokens: 'STR-04,STR-01', weaknessTokens: 'WKS-06,WKS-07' },
  // RI-STF-002 Mason Ellery
  { auditorId: 'RI-STF-002', strengthTokens: 'STR-01,STR-06', weaknessTokens: 'WKS-08,WKS-05' },

  // ── DAI Team ──────────────────────────────────────────────────
  // DGA-MGR-001 Katherine Langford
  { auditorId: 'DGA-MGR-001', strengthTokens: 'STR-03,STR-08,STR-04', weaknessTokens: 'WKS-02,WKS-08' },
  // DGA-SR-001 Marcus Keller
  { auditorId: 'DGA-SR-001', strengthTokens: 'STR-02,STR-07,STR-01', weaknessTokens: 'WKS-03,WKS-06' },
  // DGA-STF-001 Lena Cross
  { auditorId: 'DGA-STF-001', strengthTokens: 'STR-01,STR-04', weaknessTokens: 'WKS-02,WKS-01' },
  // DGA-STF-002 Simon Blake
  { auditorId: 'DGA-STF-002', strengthTokens: 'STR-02,STR-05', weaknessTokens: 'WKS-06,WKS-01' },
]

async function main() {
  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } })
  if (!company) throw new Error('Company CO-DDL not found')

  let updated = 0
  let notFound = 0

  for (const a of assignments) {
    const auditor = await prisma.auditor.findFirst({
      where: { companyId: company.id, auditorId: a.auditorId }
    })
    if (!auditor) {
      console.log('NOT FOUND: ' + a.auditorId)
      notFound++
      continue
    }
    await prisma.auditor.update({
      where: { id: auditor.id },
      data: { strengthTokens: a.strengthTokens, weaknessTokens: a.weaknessTokens }
    })
    console.log('Updated: ' + a.auditorId + ' | S: ' + a.strengthTokens + ' | W: ' + a.weaknessTokens)
    updated++
  }

  console.log('\\nDone. Updated: ' + updated + ' | Not found: ' + notFound)
}

main().catch(console.error).finally(() => prisma["$disconnect"]())
'''
open('backfill-tokens.js', 'w', encoding='utf-8').write(content)
print('done')
