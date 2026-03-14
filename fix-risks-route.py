content = open('src/app/api/risks/route.js', 'r', encoding='utf-8').read()

old = '''import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";'''

new = '''import { NextResponse } from "next/server";
import { prisma, resolveCompanyId } from "@/lib/prisma";'''

content = content.replace(old, new, 1)

old2 = '''  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const where = { companyId };'''

new2 = '''  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const where = { companyId: resolved };'''

content = content.replace(old2, new2, 1)

open('src/app/api/risks/route.js', 'w', encoding='utf-8').write(content)
print('done')
