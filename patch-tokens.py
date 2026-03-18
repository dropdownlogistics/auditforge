content = open('prisma/schema.prisma', encoding='utf-8').read()
old = '  strengths       String?\n  weaknesses      String?'
new = '  strengths       String?\n  weaknesses      String?\n  strengthTokens  String?             @map("strength_tokens")\n  weaknessTokens  String?             @map("weakness_tokens")'
fixed = content.replace(old, new)
print('patched:', 'strengthTokens' in fixed)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(fixed)
print('done')
