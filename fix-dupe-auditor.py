content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()

# Find and remove the duplicate model we added
second = content.rfind('model Auditor {')
first = content.find('model Auditor {')

if second != first:
    # Remove everything from second occurrence to its closing brace
    end = content.find('\n}', second) + 2
    content = content[:second].rstrip() + '\n' + content[end:]
    print('removed duplicate')
else:
    print('no duplicate found')

# Also remove the duplicate auditors relation we added to Company
content = content.replace(
    '  invites   Invite[]\n  auditors  Auditor[]\n\n  @@map("dim_company")',
    '  invites   Invite[]\n\n  @@map("dim_company")'
)

open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done')
