content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()

auditor_model = '''
model Auditor {
  id               String   @id @default(cuid())
  auditorId        String   @unique
  companyId        String
  name             String
  role             String
  active           Boolean  @default(true)
  hireDate         DateTime?
  departureDate    DateTime?
  certifications   String?
  specializations  String?
  bio              String?
  councilSeat      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  company          Company  @relation(fields: [companyId], references: [id])

  @@map("dim_auditor")
}
'''

content = content.replace(
    '  users     User[]\n  invites   Invite[]\n\n  @@map("dim_company")',
    '  users     User[]\n  invites   Invite[]\n  auditors  Auditor[]\n\n  @@map("dim_company")'
)

content += auditor_model

open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'dim_auditor' in content)
