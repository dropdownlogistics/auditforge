content = open('src/app/api/audits/route.js', 'r', encoding='utf-8').read()
content = content.replace(
    '      controlScope: {',
    '      team: {\n        include: {\n          auditor: { select: { auditorId: true, auditorName: true, role: true, certifications: true } }\n        },\n        orderBy: { createdAt: "asc" }\n      },\n      controlScope: {'
)
open('src/app/api/audits/route.js', 'w', encoding='utf-8').write(content)
print('done:', 'team:' in content)
