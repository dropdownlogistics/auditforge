// scripts/seed-time-entries.js
//
// AuditForge — FY2025 Team Restructure + Time Entry Seed
//
// Part 1: Restructures AuditAuditor records for all 4 FY2025 engagements
//         to the canonical Partner/Manager/Staff model (deletes existing
//         DIRECTOR/SENIOR/ENGAGEMENT_LEAD entries).
// Part 2: Seeds ~1,100 TimeEntry rows across 4 engagements. Each
//         engagement runs 6 weeks from its startDate with phases
//         weeks 1-2 Planning, 3-5 Fieldwork, 6 Reporting.
//
// Decisions ratified 2026-04-11:
//   - teamRole labels: PARTNER / MANAGER / STAFF
//   - AUD-2025-001 manager: OPS-MGR-001 Julian Vance
//   - Partner hours: accept ~53h schedule (no forced rounding to 48)
//   - Idempotency: fine-grained, skip per (engagementId, auditorId, date, component)
//   - Single script covers both parts
//   - DIRECTOR auditors stay in Dim_Auditor; dropped from AuditAuditor
//
// Run: node scripts/seed-time-entries.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── TEAM CONFIGURATION ──────────────────────────────────────────────

const ENGAGEMENTS = [
  {
    auditId: 'AUD-2025-002',
    name:    'Technology and Infrastructure Review',
    startDate: '2025-02-03',
    partner:   'AUD-011',        // Dave Kitchens
    manager:   'ITGC-MGR-001',   // Priya Desai
    associates: [
      'ITGC-SR-001',  // Daniel Carter
      'ITGC-STF-001', // Sophie Nguyen
      'ITGC-STF-002', // Ryan Patel
      'OPS-SR-001',   // Clara Hayes
      'OPS-STF-001',  // David Chen
      'DGA-SR-001',   // Marcus Keller
      'DGA-STF-001',  // Lena Cross
    ],
  },
  {
    auditId: 'AUD-2025-003',
    name:    'Governance and Compliance Review',
    startDate: '2025-04-28',
    partner:   'AUD-011',        // Dave Kitchens
    manager:   'GOV-MGR-001',    // Nadia Okafor
    associates: [
      'GOV-SR-001',   // Thomas Wyatt
      'GOV-STF-001',  // Rachel Tseng
      'GOV-STF-002',  // Derek Langham
      'HR-SR-001',    // Marcus Li
      'HR-STF-001',   // Elena Garcia
      'COMM-SR-001',  // Samuel Jones
      'COMM-STF-001', // Chloe Kim
    ],
  },
  {
    auditId: 'AUD-2025-004',
    name:    'Financial Integrity Review',
    startDate: '2025-07-07',
    partner:   'AUD-011',        // Dave Kitchens
    manager:   'FIN-MGR-001',    // Lauren Whitaker
    associates: [
      'FIN-SR-001',   // Marcus Delgado
      'FIN-STF-001',  // Sarah Chen
      'FIN-STF-002',  // Tyler Nguyen
      'RI-SR-001',    // Daniel Mercer
      'RI-STF-001',   // Priya Holloway
      'VND-SR-001',   // Raj Patel
      'VND-STF-001',  // Sophia Chen
    ],
  },
  {
    auditId: 'AUD-2025-001',
    name:    'Annual CAE Review — FY2025 Full Universe',
    startDate: '2025-09-22',
    partner:   'AUD-011',        // Dave Kitchens
    manager:   'OPS-MGR-001',    // Julian Vance (per decision #3)
    associates: [
      'ITGC-SR-001',  // Daniel Carter (reused from -002)
      'GOV-SR-001',   // Thomas Wyatt (reused from -003)
      'FIN-SR-001',   // Marcus Delgado (reused from -004)
      'DGA-STF-002',  // Simon Blake (fresh)
      'OPS-STF-002',  // Maya Robinson (fresh)
      'RI-STF-002',   // Mason Ellery (fresh)
      'COMM-STF-002', // Ben Carter (fresh)
      'HR-STF-002',   // Jonah Park (fresh)
    ],
  },
];

// ── PHASE STRUCTURE (6-week engagement) ─────────────────────────────
// Weeks 0-1 Planning, 2-4 Fieldwork, 5 Reporting

const PHASES = [
  { week: 0, name: 'Planning',  subcomponents: ['Risk Assessment', 'Meeting', 'Document Review'] },
  { week: 1, name: 'Planning',  subcomponents: ['Risk Assessment', 'Meeting', 'Document Review'] },
  { week: 2, name: 'Fieldwork', subcomponents: ['Testing', 'Walkthrough', 'Meeting'] },
  { week: 3, name: 'Fieldwork', subcomponents: ['Testing', 'Walkthrough', 'Meeting'] },
  { week: 4, name: 'Fieldwork', subcomponents: ['Testing', 'Walkthrough', 'Meeting'] },
  { week: 5, name: 'Reporting', subcomponents: ['Document Review', 'Meeting', 'Admin'] },
];

// Mon=0 Tue=1 Wed=2 Thu=0 Fri=1 — rotation index into phase.subcomponents
const DAY_ROTATION = [0, 1, 2, 0, 1];

// ── ROLE WEEKLY TARGETS ─────────────────────────────────────────────
// Associate: ~40h/week, ±4h variance
// Manager: Planning 26h, Fieldwork 24h, Reporting 28h, ±2h variance
// Partner: Planning 10h, Fieldwork 7h, Reporting 12h, ±1h variance
//          (53h scheduled × ~0.9 after 10% skip rate ≈ 48h actual)

const WEEKLY_TARGETS = {
  STAFF:   { Planning: 40, Fieldwork: 40, Reporting: 40 },
  MANAGER: { Planning: 26, Fieldwork: 24, Reporting: 28 },
  PARTNER: { Planning: 10, Fieldwork: 7,  Reporting: 12 },
};

const WEEKLY_VARIANCE = {
  STAFF:   4,
  MANAGER: 2,
  PARTNER: 1,
};

const NON_BILLABLE_COMPONENTS = new Set(['Admin']);
const PARTNER_SKIP_RATE = 0.10; // 10% chance partner skips a given day

// ── UTILITIES ───────────────────────────────────────────────────────

// Mulberry32 deterministic RNG — ensures reproducible hours across runs
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2AE387;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniform(rng, min, max) {
  return min + rng() * (max - min);
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

function addDaysUTC(baseDate, days) {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function monthTag(date) {
  return date.toISOString().slice(0, 7);
}

// ── PART 1 — TEAM RESTRUCTURE ───────────────────────────────────────

async function restructureTeams(company) {
  console.log('\n=== PART 1: Restructuring AuditAuditor teams ===\n');

  const resolveAuditor = async (naturalId) => {
    const a = await prisma.auditor.findFirst({
      where: { companyId: company.id, auditorId: naturalId },
    });
    if (!a) throw new Error('Auditor not found: ' + naturalId);
    return a;
  };

  const resolveAudit = async (naturalId) => {
    const a = await prisma.audit.findUnique({ where: { auditId: naturalId } });
    if (!a) throw new Error('Audit not found: ' + naturalId);
    return a;
  };

  let totalDeleted = 0;
  let totalCreated = 0;

  for (const eng of ENGAGEMENTS) {
    console.log(`[${eng.auditId}] ${eng.name}`);
    const audit = await resolveAudit(eng.auditId);

    // Delete all existing AuditAuditor rows for this engagement
    const deleted = await prisma.auditAuditor.deleteMany({
      where: { auditId: audit.id },
    });
    console.log(`  - deleted ${deleted.count} existing team records`);
    totalDeleted += deleted.count;

    // Create Partner
    const partner = await resolveAuditor(eng.partner);
    await prisma.auditAuditor.create({
      data: {
        auditId:       audit.id,
        auditorId:     partner.id,
        teamRole:      'PARTNER',
        budgetHours:   48,
        assignedPhase: 'ALL',
      },
    });
    totalCreated++;
    console.log(`  + PARTNER  ${eng.partner.padEnd(14)} ${partner.auditorName}  @ 48h`);

    // Create Manager
    const manager = await resolveAuditor(eng.manager);
    await prisma.auditAuditor.create({
      data: {
        auditId:       audit.id,
        auditorId:     manager.id,
        teamRole:      'MANAGER',
        budgetHours:   150,
        assignedPhase: 'ALL',
      },
    });
    totalCreated++;
    console.log(`  + MANAGER  ${eng.manager.padEnd(14)} ${manager.auditorName}  @ 150h`);

    // Create Staff (task's "Associates" mapped to STAFF per decision #2)
    for (const assocId of eng.associates) {
      const a = await resolveAuditor(assocId);
      await prisma.auditAuditor.create({
        data: {
          auditId:       audit.id,
          auditorId:     a.id,
          teamRole:      'STAFF',
          budgetHours:   240,
          assignedPhase: 'ALL',
        },
      });
      totalCreated++;
      console.log(`  + STAFF    ${assocId.padEnd(14)} ${a.auditorName}  @ 240h`);
    }

    console.log();
  }

  console.log(`Part 1 complete. Deleted ${totalDeleted}, created ${totalCreated}.`);
  return { deleted: totalDeleted, created: totalCreated };
}

// ── PART 2 — TIME ENTRY SEEDING ─────────────────────────────────────

async function seedTimeEntries(company) {
  console.log('\n=== PART 2: Seeding TimeEntry rows ===\n');

  const rng = mulberry32(20260411); // deterministic seed for reproducibility

  const resolveAuditor = async (naturalId) => {
    const a = await prisma.auditor.findFirst({
      where: { companyId: company.id, auditorId: naturalId },
    });
    if (!a) throw new Error('Auditor not found: ' + naturalId);
    return a;
  };

  const resolveAudit = async (naturalId) => {
    const a = await prisma.audit.findUnique({ where: { auditId: naturalId } });
    if (!a) throw new Error('Audit not found: ' + naturalId);
    return a;
  };

  let totalCreated = 0;
  let totalSkipped = 0;
  const hoursByEng = {};

  for (const eng of ENGAGEMENTS) {
    console.log(`[${eng.auditId}] ${eng.name} — start ${eng.startDate}`);
    const audit = await resolveAudit(eng.auditId);
    const startDate = new Date(eng.startDate + 'T00:00:00.000Z');

    // Sanity check: start date should be a Monday (UTC)
    if (startDate.getUTCDay() !== 1) {
      console.warn(`  WARN: ${eng.startDate} is not a Monday (UTC day ${startDate.getUTCDay()})`);
    }

    // Build team roster
    const team = [
      { role: 'PARTNER', auditor: await resolveAuditor(eng.partner) },
      { role: 'MANAGER', auditor: await resolveAuditor(eng.manager) },
    ];
    for (const assocId of eng.associates) {
      team.push({ role: 'STAFF', auditor: await resolveAuditor(assocId) });
    }

    let engCreated = 0;
    let engSkipped = 0;
    let engHours = 0;

    for (const member of team) {
      for (let weekIdx = 0; weekIdx < 6; weekIdx++) {
        const phase = PHASES[weekIdx];
        const target = WEEKLY_TARGETS[member.role][phase.name];
        const variance = WEEKLY_VARIANCE[member.role];
        const adjustedWeekly = target + uniform(rng, -variance, variance);
        const dailyBase = adjustedWeekly / 5;

        for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
          const dayOffset = weekIdx * 7 + dayIdx;
          const entryDate = addDaysUTC(startDate, dayOffset);

          // Partners occasionally skip a day (spread thin is realistic)
          if (member.role === 'PARTNER' && rng() < PARTNER_SKIP_RATE) continue;

          // Daily variance ±0.5h on top of weekly variance, clamp to positive
          const rawHours = dailyBase + uniform(rng, -0.5, 0.5);
          const hours = round1(Math.max(0.1, rawHours));

          // Subcomponent via deterministic day-of-week rotation
          const subIdx = DAY_ROTATION[dayIdx];
          const component = phase.subcomponents[subIdx];
          const timeType = NON_BILLABLE_COMPONENTS.has(component) ? 'NON_BILLABLE' : 'BILLABLE';

          // Fine-grained idempotency: skip if entry exists for this exact slot
          const existing = await prisma.timeEntry.findFirst({
            where: {
              engagementId: audit.id,
              auditorId:    member.auditor.id,
              date:         entryDate,
              component,
            },
          });
          if (existing) {
            engSkipped++;
            continue;
          }

          await prisma.timeEntry.create({
            data: {
              auditorId:    member.auditor.id,
              engagementId: audit.id,
              date:         entryDate,
              monthTag:     monthTag(entryDate),
              hours,
              timeType,
              component,
              category:     'Audits',
              comments:     `${phase.name}: ${component}`,
            },
          });
          engCreated++;
          engHours += hours;
        }
      }
    }

    console.log(`  created ${engCreated}, skipped ${engSkipped}, total ~${engHours.toFixed(1)}h`);
    totalCreated += engCreated;
    totalSkipped += engSkipped;
    hoursByEng[eng.auditId] = engHours;
  }

  console.log(`\nPart 2 complete. Created ${totalCreated}, skipped ${totalSkipped}.`);
  return { created: totalCreated, skipped: totalSkipped, hoursByEng };
}

// ── MAIN ────────────────────────────────────────────────────────────

async function main() {
  console.log('AuditForge — FY2025 team restructure + time entry seed');
  console.log('─────────────────────────────────────────────────────────');

  const company = await prisma.company.findUnique({ where: { companyId: 'CO-DDL' } });
  if (!company) throw new Error('Company CO-DDL not found');
  console.log(`Company: ${company.companyId} (${company.name})`);

  const p1 = await restructureTeams(company);
  const p2 = await seedTimeEntries(company);

  console.log('\n═════════════════════ SUMMARY ═════════════════════');
  console.log(`Part 1 — AuditAuditor:`);
  console.log(`  deleted: ${p1.deleted}`);
  console.log(`  created: ${p1.created}`);
  console.log(`Part 2 — TimeEntry:`);
  console.log(`  created: ${p2.created}`);
  console.log(`  skipped: ${p2.skipped} (idempotent re-runs)`);
  console.log(`  total hours by engagement:`);
  for (const [id, h] of Object.entries(p2.hoursByEng)) {
    console.log(`    ${id}: ${h.toFixed(1)}h`);
  }
  console.log('───────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
