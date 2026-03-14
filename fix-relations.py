content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()
content = content.replace(
    '  scopes    Scope[]\n  users     User[]\n  invites   Invite[]',
    '  scopes    Scope[]\n  users     User[]\n  invites   Invite[]'
)
# Fix: make sure relations are on Company
if 'users     User[]' not in content:
    content = content.replace(
        '  scopes    Scope[]\n\n  @@map',
        '  scopes    Scope[]\n  users     User[]\n  invites   Invite[]\n\n  @@map'
    )
open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'users     User[]' in content)
