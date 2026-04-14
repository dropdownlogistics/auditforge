const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const p = new PrismaClient();

(async () => {
  const snapshotDir = path.join(__dirname, "..", "_snapshots");
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, "data-fix-20260414-controls-pre.json");

  const preControls = await p.control.findMany({
    select: {
      id: true,
      controlId: true,
      reviewStatus: true,
      lifecycle: true,
      designEffectiveness: true,
      operatingEffectiveness: true,
      version: true,
    },
    orderBy: { controlId: "asc" },
  });
  fs.writeFileSync(
    snapshotPath,
    JSON.stringify({ takenAt: new Date().toISOString(), count: preControls.length, controls: preControls }, null, 2)
  );
  console.log(`Snapshot written: ${snapshotPath} (${preControls.length} controls)`);

  const result = await p.control.updateMany({
    data: { reviewStatus: "APPROVED" },
  });
  console.log(`\nUpdated ${result.count} controls → reviewStatus=APPROVED`);

  const byReview = await p.control.groupBy({ by: ["reviewStatus"], _count: { _all: true } });
  const total = await p.control.count();
  console.log(`\n=== VERIFICATION ===`);
  console.log(`total controls: ${total}`);
  console.log(`byReviewStatus:`, JSON.stringify(byReview));

  const nonApproved = await p.control.count({ where: { NOT: { reviewStatus: "APPROVED" } } });
  console.log(`non-APPROVED remaining: ${nonApproved}`);
  console.log(`DRAFT remaining: ${await p.control.count({ where: { reviewStatus: "DRAFT" } })}`);

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FATAL:", e);
  await p.$disconnect();
  process.exit(1);
});
