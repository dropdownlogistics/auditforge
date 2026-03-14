content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()
content = content.replace(
    '  scopes    Scope[]\n  auditors  Auditor[]\n  audits    Audit[]\n\n  @@map("dim_company")',
    '  scopes    Scope[]\n  auditors  Auditor[]\n  audits    Audit[]\n  users     User[]\n  invites   Invite[]\n\n  @@map("dim_company")'
)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'users     User[]' in content)
