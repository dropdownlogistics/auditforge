const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const FINDINGS = [
  {
    findingId: "FND-2025-001",
    severity: "CONTROL_DEFICIENCY",
    status: "CLOSED",
    title: "Stale user accounts in financial reporting system",
    description:
      "Review of Oracle Fusion user access revealed 14 terminated employees retained active accounts up to 47 days post-departure. HR notifications to IT were inconsistent and lacked a defined SLA.",
    owner: "Priya Chen, Director of IT Security",
    targetDate: "2025-08-31",
    closedDate: "2025-10-22",
    managementResponse:
      "Implemented automated deprovisioning via Okta lifecycle triggers tied to Workday. New SLA of 24 hours enforced. Exception reports reviewed weekly by IT Security.",
  },
  {
    findingId: "FND-2025-002",
    severity: "CONTROL_DEFICIENCY",
    status: "CLOSED",
    title: "Journal entry segregation bypassed for month-end accruals",
    description:
      "Two general ledger staff recorded self-approval of journal entries exceeding $50K materiality threshold during Q2 close. System configuration allowed posting without independent review when preparer had JE_POST role assigned.",
    owner: "Marcus Bell, Controller",
    targetDate: "2025-09-30",
    closedDate: "2025-11-14",
    managementResponse:
      "Reconfigured Oracle Fusion approval matrix — all JEs over $25K now require secondary sign-off regardless of preparer role. Quarterly user role attestation added to compliance calendar.",
  },
  {
    findingId: "FND-2025-003",
    severity: "OBSERVATION",
    status: "CLOSED",
    title: "Control narrative documentation incomplete for revenue recognition",
    description:
      "Seven of the 23 revenue controls did not have updated narratives reflecting the ASC 606 transition completed in FY2024. Testing proceeded using interview-based understanding; no deficiency in operation identified.",
    owner: "Jenna Morales, Revenue Accounting Manager",
    targetDate: "2025-12-15",
    closedDate: "2025-12-08",
    managementResponse:
      "Updated all seven control narratives. Process owner signoff obtained. Narrative refresh now part of annual SOX readiness checklist.",
  },
  {
    findingId: "FND-2025-004",
    severity: "OBSERVATION",
    status: "CLOSED",
    title: "Vendor master file data quality — duplicate entries",
    description:
      "Identified 38 potential duplicate vendor records in Oracle Fusion (matched by tax ID, bank account, or address). No fraudulent activity detected; duplicates traced to legacy AP migration and manual entry variance.",
    owner: "Todd Reyes, Procurement Operations Manager",
    targetDate: "2025-11-30",
    closedDate: "2025-12-12",
    managementResponse:
      "Cleansed vendor master — 31 duplicates merged, 7 retained after review (distinct business entities with shared parent). Monthly duplicate-check report now runs automatically.",
  },
  {
    findingId: "FND-2025-005",
    severity: "OBSERVATION",
    status: "CLOSED",
    title: "Privileged access review not evidenced for Q1",
    description:
      "Quarterly privileged user access review was performed for Q1 2025 but evidence of review (signed attestation, user list snapshot) could not be produced for three of the nine in-scope systems.",
    owner: "Priya Chen, Director of IT Security",
    targetDate: "2025-07-31",
    closedDate: "2025-08-19",
    managementResponse:
      "Evidence retention policy revised. SailPoint access review workflow now auto-archives attestations to SharePoint with 7-year retention. Q2 review fully evidenced.",
  },
  {
    findingId: "FND-2025-006",
    severity: "SIGNIFICANT_DEFICIENCY",
    status: "IN_REMEDIATION",
    title: "Insufficient IT general controls over database change management",
    description:
      "Testing of 40 database schema changes to the financial reporting environment found 7 deployments (17.5%) lacked documented change approval in ServiceNow. Three of those touched revenue-bearing tables. Compensating controls (post-deployment reconciliation) operated but were not formally documented as compensating.",
    owner: "Raj Patel, VP Engineering",
    targetDate: "2026-06-30",
    closedDate: null,
    managementResponse:
      "Remediation in progress. ServiceNow CAB workflow made mandatory gate in CI/CD pipeline as of 2026-02-15. Historical gap being addressed via retroactive ticketing; formal compensating control documentation in review with External Auditor. Target retest Q2 FY2026.",
  },
  {
    findingId: "FND-2025-007",
    severity: "CONTROL_DEFICIENCY",
    status: "IN_REMEDIATION",
    title: "Bank reconciliation review lag on foreign subsidiary accounts",
    description:
      "Four non-US subsidiary bank accounts showed reconciliations completed 31-47 days after month-end, versus the 15-day policy. Reviewer signoff followed preparer by an average of 22 days. No unreconciled differences identified, but control timeliness deficient.",
    owner: "Hilda Sørensen, International Controller",
    targetDate: "2026-09-30",
    closedDate: null,
    managementResponse:
      "Staffing gap in EMEA treasury filled 2026-03-01. New close calendar published with hard gates; escalation to Corporate Controller automatic at day 20. Monitoring Q1-Q2 FY2026 to confirm sustained timeliness before closure.",
  },
  {
    findingId: "FND-2025-008",
    severity: "OBSERVATION",
    status: "OPEN",
    title: "Policy exception log not centralized",
    description:
      "Policy exceptions were granted and tracked in six different locations (email, Teams, SharePoint, local spreadsheets). No single source of truth for active exceptions or expiration dates. No exceptions found expired without renewal, but operational risk elevated.",
    owner: "Dana Okafor, Chief Compliance Officer",
    targetDate: "2026-12-31",
    closedDate: null,
    managementResponse: null,
  },
];

(async () => {
  const company = await p.company.findFirst({ select: { id: true, companyId: true } });
  if (!company) throw new Error("No company found");
  const audit = await p.audit.findUnique({ where: { auditId: "AUD-2025-001" }, select: { id: true } });
  if (!audit) throw new Error("AUD-2025-001 not found");

  for (const f of FINDINGS) {
    await p.finding.upsert({
      where: { findingId: f.findingId },
      update: {
        companyId: company.id,
        auditId: audit.id,
        title: f.title,
        description: f.description,
        severity: f.severity,
        status: f.status,
        owner: f.owner,
        targetDate: f.targetDate ? new Date(f.targetDate) : null,
        closedDate: f.closedDate ? new Date(f.closedDate) : null,
        managementResponse: f.managementResponse,
      },
      create: {
        findingId: f.findingId,
        companyId: company.id,
        auditId: audit.id,
        title: f.title,
        description: f.description,
        severity: f.severity,
        status: f.status,
        owner: f.owner,
        targetDate: f.targetDate ? new Date(f.targetDate) : null,
        closedDate: f.closedDate ? new Date(f.closedDate) : null,
        managementResponse: f.managementResponse,
      },
    });
  }

  const count = await p.finding.count();
  const bySeverity = await p.finding.groupBy({ by: ["severity"], _count: { _all: true } });
  const byStatus = await p.finding.groupBy({ by: ["status"], _count: { _all: true } });
  console.log(`Seeded ${FINDINGS.length} findings. Total in DB: ${count}`);
  console.log("severity:", JSON.stringify(bySeverity));
  console.log("status:", JSON.stringify(byStatus));

  await p.$disconnect();
})().catch(async (e) => {
  console.error("FATAL:", e);
  await p.$disconnect();
  process.exit(1);
});
