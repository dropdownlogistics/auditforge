content = open('prisma/schema.prisma', encoding='utf-8').read()

# Remove the duplicate block
bad = '  strengthTokens  String?             @map(\"strength_tokens\")\n  weaknessTokens  String?             @map(\"weakness_tokens\")\n  strengthTokens  String?             @map(\"strength_tokens\")\n  weaknessTokens  String?             @map(\"weakness_tokens\")'
good = '  strengthTokens  String?             @map(\"strength_tokens\")\n  weaknessTokens  String?             @map(\"weakness_tokens\")'

fixed = content.replace(bad, good)
print('fixed:', bad in content, '-> duplicate removed:', bad not in fixed)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(fixed)
print('done')
