content = open('prisma/schema.prisma', 'r', encoding='utf-8').read()

bridge = '''
model AuditAuditor {
  id           String   @id @default(cuid())
  auditId      String   @map("audit_id")
  auditorId    String   @map("auditor_id")
  teamRole     String   @default("STAFF") // LEAD, SENIOR, STAFF, REVIEWER, PARTNER
  budgetHours  Float?   @map("budget_hours")
  assignedPhase String  @default("ALL") // PLANNING, FIELDWORK, REPORTING, ALL
  createdAt    DateTime @default(now()) @map("created_at")

  audit        Audit    @relation(fields: [auditId], references: [id])
  auditor      Auditor  @relation(fields: [auditorId], references: [id])

  @@unique([auditId, auditorId])
  @@map("bridge_audit_auditor")
}
'''

# Add relation to Audit model
content = content.replace(
    '  controlScope    AuditControlScope[]\n  @@index([companyId])',
    '  controlScope    AuditControlScope[]\n  team            AuditAuditor[]\n  @@index([companyId])'
)

# Add relation to Auditor model
content = content.replace(
    '  ledAudits        Audit[]             @relation("LeadAuditor")\n  scopeAssignments AuditControlScope[] @relation("ScopeAssignee")',
    '  ledAudits        Audit[]             @relation("LeadAuditor")\n  scopeAssignments AuditControlScope[] @relation("ScopeAssignee")\n  teamAssignments  AuditAuditor[]'
)

content += bridge

open('prisma/schema.prisma', 'w', encoding='utf-8').write(content)
print('done:', 'bridge_audit_auditor' in content)
