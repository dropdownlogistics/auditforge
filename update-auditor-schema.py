content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()
content = content.replace(
    '  certifications  String?  // comma-separated: CPA, CIA, CISA\n  independence    String   @default("INTERNAL") // INTERNAL, EXTERNAL, REGULATORY\n  firm            String?\n  isActive        Boolean  @default(true) @map("is_active")',
    '  role            String   @default("STAFF") // STAFF, SENIOR, MANAGER, DIRECTOR, PARTNER\n  certifications  String?  // comma-separated: CPA, CIA, CISA\n  specializations String?\n  bio             String?\n  councilSeat     String?\n  hireDate        DateTime? @map("hire_date")\n  departureDate   DateTime? @map("departure_date")\n  independence    String   @default("INTERNAL") // INTERNAL, EXTERNAL, REGULATORY\n  firm            String?\n  isActive        Boolean  @default(true) @map("is_active")'
)
open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'councilSeat' in content)
