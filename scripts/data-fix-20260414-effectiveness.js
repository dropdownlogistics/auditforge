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

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assign(n, spec) {
  const result = [];
  for (const [value, count] of spec) for (let i = 0; i < count; i++) result.push(value);
  if (result.length !== n) throw new Error(`spec sums to ${result.length} but need ${n}`);
  return result;
}

(async () => {
  const snapshotDir = path.join(__dirname, "..", "_snapshots");
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, "data-fix-20260414-effectiveness-pre.json");

  const audit = await p.audit.findUnique({ where: { auditId: "AUD-2025-001" }, select: { id: true } });
  if (!audit) throw new Error("AUD-2025-001 not found");

  const scopeRows = await p.auditControlScope.findMany({
    where: { auditId: audit.id, scopeDecision: "IN_SCOPE" },
    select: { controlId: true },
  });
  const controlInternalIds = scopeRows.map((s) => s.controlId);

  const preControls = await p.control.findMany({
    where: { id: { in: controlInternalIds } },
    select: { id: true, controlId: true, designEffectiveness: true, operatingEffectiveness: true },
    orderBy: { controlId: "asc" },
  });

  fs.writeFileSync(
    snapshotPath,
    JSON.stringify({ takenAt: new Date().toISOString(), auditId: "AUD-2025-001", count: preControls.length, controls: preControls }, null, 2)
  );
  console.log(`Snapshot written: ${snapshotPath} (${preControls.length} controls)`);

  if (preControls.length !== 106) throw new Error(`Expected 106 controls for AUD-2025-001, got ${preControls.length}`);

  const rand = mulberry32(20260414);

  const designPool = shuffle(
    assign(106, [["EFFECTIVE", 85], ["PARTIALLY_EFFECTIVE", 15], ["INEFFECTIVE", 6]]),
    rand
  );
  const opPool = shuffle(
    assign(106, [["EFFECTIVE", 80], ["PARTIALLY_EFFECTIVE", 18], ["INEFFECTIVE", 8]]),
    rand
  );

  const sorted = preControls.slice().sort((a, b) => a.controlId.localeCompare(b.controlId));

  await p.$transaction(async (tx) => {
    for (let i = 0; i < sorted.length; i++) {
      await tx.control.update({
        where: { id: sorted[i].id },
        data: {
          designEffectiveness: designPool[i],
          operatingEffectiveness: opPool[i],
        },
      });
    }
  });

  console.log(`\nUpdated ${sorted.length} controls with design + operating effectiveness`);

  const byDesign = await p.control.groupBy({
    by: ["designEffectiveness"],
    _count: { _all: true },
    where: { id: { in: controlInternalIds } },
  });
  const byOp = await p.control.groupBy({
    by: ["operatingEffectiveness"],
    _count: { _all: true },
    where: { id: { in: controlInternalIds } },
  });

  console.log(`\n=== AUD-2025-001 EFFECTIVENESS VERIFICATION ===`);
  console.log("designEffectiveness:", JSON.stringify(byDesign));
  console.log("operatingEffectiveness:", JSON.stringify(byOp));

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FATAL:", e);
  await p.$disconnect();
  process.exit(1);
});
