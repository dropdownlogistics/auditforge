content = open('prisma/schema.prisma', encoding='utf-8').read()
old = '  councilSeat           String?             @map("council_seat")'
new = '  councilSeat           String?             @map("council_seat")\n  strengths              String?             @map("strengths")\n  weaknesses             String?             @map("weaknesses")'
fixed = content.replace(old, new)
print('patched:', 'strengths' in fixed)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(fixed)
print('done')
