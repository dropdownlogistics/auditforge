const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const p = new PrismaClient();

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANGES = {
  "AUD-2025-001": { PARTNER: [60, 80], MANAGER: [180, 220], STAFF: [280, 320] },
  "AUD-2025-002": { PARTNER: [40, 60], MANAGER: [120, 160], STAFF: [200, 260] },
  "AUD-2025-003": { PARTNER: [40, 50], MANAGER: [100, 140], STAFF: [180, 240] },
  "AUD-2025-004": { PARTNER: [40, 50], MANAGER: [100, 140], STAFF: [180, 240] },
};

(async () => {
  const snapshotDir = path.join(__dirname, "..", "_snapshots");
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, `data-fix-20260414-pre.json`);

  const preAudits = await p.audit.findMany({
    where: { auditId: { in: ["AUD-2025-001", "AUD-2025-002", "AUD-2025-003", "AUD-2025-004"] } },
    include: { period: true },
  });
  const preBridge = await p.auditAuditor.findMany({
    where: { audit: { auditId: { in: ["AUD-2025-001", "AUD-2025-002", "AUD-2025-003", "AUD-2025-004"] } } },
    include: { audit: { select: { auditId: true } }, auditor: { select: { auditorId: true, auditorName: true } } },
  });
  const prePeriods = await p.period.findMany();
  fs.writeFileSync(
    snapshotPath,
    JSON.stringify({ takenAt: new Date().toISOString(), audits: preAudits, bridge: preBridge, periods: prePeriods }, null, 2)
  );
  console.log(`Snapshot written: ${snapshotPath}`);
  console.log(`  audits: ${preAudits.length}, bridge: ${preBridge.length}, periods: ${prePeriods.length}`);

  const aud001 = preAudits.find((a) => a.auditId === "AUD-2025-001");
  if (!aud001) throw new Error("AUD-2025-001 not found");
  const companyId = aud001.companyId;

  const rand = mulberry32(20260414);

  const auditInternalId = Object.fromEntries(preAudits.map((a) => [a.auditId, a.id]));
  const bridgeByAudit = {};
  for (const b of preBridge) {
    const aid = b.audit.auditId;
    (bridgeByAudit[aid] ||= []).push(b);
  }

  const hourUpdates = [];
  for (const [aid, roleRanges] of Object.entries(RANGES)) {
    const rows = bridgeByAudit[aid] || [];
    rows.sort((a, b) => a.id.localeCompare(b.id));
    for (const row of rows) {
      const range = roleRanges[row.teamRole];
      if (!range) {
        console.warn(`  ! no range for ${aid} teamRole=${row.teamRole} (id=${row.id}) — skipping`);
        continue;
      }
      const [lo, hi] = range;
      const raw = lo + rand() * (hi - lo);
      const hours = Math.round(raw * 10) / 10;
      hourUpdates.push({ id: row.id, hours, teamRole: row.teamRole, auditId: aid });
    }
  }

  const result = await p.$transaction(async (tx) => {
    const existingFY26 = await tx.period.findUnique({
      where: { companyId_periodLabel: { companyId, periodLabel: "FY2026" } },
    });
    const fy26 =
      existingFY26 ??
      (await tx.period.create({
        data: {
          companyId,
          periodLabel: "FY2026",
          periodStart: new Date("2026-01-01T00:00:00Z"),
          periodEnd: new Date("2026-12-31T00:00:00Z"),
          periodType: "ANNUAL",
        },
      }));

    await tx.audit.update({
      where: { id: auditInternalId["AUD-2025-001"] },
      data: { status: "COMPLETED", reportDate: new Date("2025-12-19T00:00:00Z") },
    });

    await tx.audit.update({
      where: { id: auditInternalId["AUD-2025-002"] },
      data: {
        status: "REPORTING",
        periodId: fy26.id,
        startDate: new Date("2026-01-06T00:00:00Z"),
        endDate: new Date("2026-03-28T00:00:00Z"),
      },
    });
    await tx.audit.update({
      where: { id: auditInternalId["AUD-2025-003"] },
      data: {
        periodId: fy26.id,
        startDate: new Date("2026-04-14T00:00:00Z"),
        endDate: new Date("2026-06-27T00:00:00Z"),
      },
    });
    await tx.audit.update({
      where: { id: auditInternalId["AUD-2025-004"] },
      data: {
        periodId: fy26.id,
        startDate: new Date("2026-07-07T00:00:00Z"),
        endDate: new Date("2026-09-05T00:00:00Z"),
      },
    });

    for (const u of hourUpdates) {
      await tx.auditAuditor.update({ where: { id: u.id }, data: { budgetHours: u.hours } });
    }

    return { fy26Id: fy26.id, fy26Created: !existingFY26, hoursUpdated: hourUpdates.length };
  });

  console.log(`\nTransaction committed:`);
  console.log(`  FY2026 Period: ${result.fy26Created ? "CREATED" : "reused"} id=${result.fy26Id}`);
  console.log(`  Bridge rows updated: ${result.hoursUpdated}`);

  console.log(`\n=== VERIFICATION ===`);
  const postAudits = await p.audit.findMany({
    where: { auditId: { in: ["AUD-2025-001", "AUD-2025-002", "AUD-2025-003", "AUD-2025-004"] } },
    select: {
      auditId: true,
      auditName: true,
      status: true,
      startDate: true,
      endDate: true,
      reportDate: true,
      period: { select: { periodLabel: true } },
    },
    orderBy: { auditId: "asc" },
  });
  console.log(JSON.stringify(postAudits, null, 2));

  console.log(`\n=== BUDGET HOURS PER AUDIT × ROLE ===`);
  for (const aid of ["AUD-2025-001", "AUD-2025-002", "AUD-2025-003", "AUD-2025-004"]) {
    const rows = await p.auditAuditor.findMany({
      where: { audit: { auditId: aid } },
      select: { teamRole: true, budgetHours: true },
    });
    const byRole = {};
    for (const r of rows) {
      (byRole[r.teamRole] ||= []).push(r.budgetHours);
    }
    const summary = Object.fromEntries(
      Object.entries(byRole).map(([role, hrs]) => [
        role,
        {
          n: hrs.length,
          min: Math.min(...hrs),
          max: Math.max(...hrs),
          avg: Math.round((hrs.reduce((a, b) => a + b, 0) / hrs.length) * 10) / 10,
        },
      ])
    );
    console.log(`${aid}:`, JSON.stringify(summary));
  }

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FATAL:", e);
  await p.$disconnect();
  process.exit(1);
});
