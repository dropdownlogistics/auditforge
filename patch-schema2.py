content = open('prisma/schema.prisma', encoding='utf-8').read()
old = '  councilSeat     String?\n  hireDate'
new = '  councilSeat     String?\n  strengths       String?\n  weaknesses      String?\n  hireDate'
fixed = content.replace(old, new)
print('patched:', 'strengths' in fixed)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(fixed)
print('done')
