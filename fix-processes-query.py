content = open('src/app/api/processes/route.js', 'r', encoding='utf-8').read()

old = '''  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const processes = await prisma.process.findMany({
    where: { companyId },'''

new = '''  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const resolved = await resolveCompanyId(companyId);
  if (!resolved) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const processes = await prisma.process.findMany({
    where: { companyId: resolved },'''

content = content.replace(old, new, 1)
open('src/app/api/processes/route.js', 'w', encoding='utf-8').write(content)
print('done')
