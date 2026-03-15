content = open('scripts/seed-auditors.js', 'r', encoding='utf-8').read()
content = content.replace(
    'prisma.())',
    'prisma.())'
)
open('scripts/seed-auditors.js', 'w', encoding='utf-8').write(content)
print('done')
