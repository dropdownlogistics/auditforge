content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()
content = content.replace(
    '  controlScope    AuditControlScope[]\n  @@index([companyId])\n  @@index([periodId])\n  @@index([status])\n  @@map("fact_audit")',
    '  controlScope    AuditControlScope[]\n  team            AuditAuditor[]\n  @@index([companyId])\n  @@index([periodId])\n  @@index([status])\n  @@map("fact_audit")'
)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'AuditAuditor[]' in content)
