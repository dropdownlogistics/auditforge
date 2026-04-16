import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows: Array<{
    id: string;
    control_id: string;
    control_nature: string;
    process: string | null;
  }> = await prisma.$queryRaw`
    SELECT c.id, c.control_id, c.control_nature::text, p.process_name as process
      FROM fact_control c
      LEFT JOIN dim_process p ON c.process_id = p.id
     WHERE c.control_type_id IS NULL
     ORDER BY c.control_id
  `;

  console.log(`\n${rows.length} controls with null controlTypeId:\n`);
  console.table(rows);

  // Also summarize by (nature, process) to spot patterns.
  const pattern = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.control_nature} · ${r.process ?? "—"}`;
    pattern.set(key, (pattern.get(key) ?? 0) + 1);
  }
  console.log(`\nPattern summary:`);
  for (const [k, v] of [...pattern.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.toString().padStart(3)} × ${k}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
