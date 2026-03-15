lines = open('prisma/schema.prisma', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if '  controlScope    AuditControlScope[]' in line:
        lines.insert(i+1, '  team            AuditAuditor[]\n')
        print('inserted at line', i+1)
        break
open('prisma/schema.prisma', 'w', encoding='utf-8').write(''.join(lines))
