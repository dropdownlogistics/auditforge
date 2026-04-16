// AuditForge — Phase A HR Backfill Script
// Idempotent: safe to run multiple times.
// Run: node prisma/backfill-hr.js
//
// Populates dim_role, dim_department, dim_employee_status, dim_token,
// then backfills employee HR fields, creates fact history, and migrates
// auditor profile data to sibling tables.

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const report = { processed: {}, flagged: [], errors: [] };

function log(section, msg) {
  console.log(`[${section}] ${msg}`);
}

async function main() {
  console.log("=== PHASE A BACKFILL START ===\n");

  const company = await prisma.company.findFirst({ where: { companyId: "CO-DDL" } });
  if (!company) throw new Error("Company CO-DDL not found");

  // ──────────────────────────────────────────────────────────
  // 1. Seed dim_role from distinct Employee.role values
  // ──────────────────────────────────────────────────────────
  const roleLevels = {
    STAFF: 1, SENIOR: 2, REVIEWER: 2, MANAGER: 3,
    ENGAGEMENT_LEAD: 3, DIRECTOR: 4, PARTNER: 5,
  };
  const distinctRoles = await prisma.$queryRaw`
    SELECT DISTINCT role FROM dim_employee WHERE role IS NOT NULL ORDER BY role
  `;
  let roleCount = 0;
  for (const { role } of distinctRoles) {
    const level = roleLevels[role] || 1;
    await prisma.role.upsert({
      where: { companyId_label: { companyId: company.id, label: role } },
      update: {},
      create: { companyId: company.id, label: role, level },
    });
    roleCount++;
  }
  log("1-ROLES", `Seeded ${roleCount} roles: ${distinctRoles.map(r => r.role).join(", ")}`);
  report.processed.roles = roleCount;

  // ──────────────────────────────────────────────────────────
  // 2. Seed dim_department from distinct Employee.department
  // ──────────────────────────────────────────────────────────
  const distinctDepts = await prisma.$queryRaw`
    SELECT DISTINCT department FROM dim_employee WHERE department IS NOT NULL AND department != '' ORDER BY department
  `;
  let deptCount = 0;
  if (distinctDepts.length === 0) {
    await prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: "Audit" } },
      update: {},
      create: { companyId: company.id, name: "Audit" },
    });
    deptCount = 1;
    report.flagged.push("All department values are NULL in DB. Created default 'Audit' department for all employees.");
  } else {
    for (const { department } of distinctDepts) {
      await prisma.department.upsert({
        where: { companyId_name: { companyId: company.id, name: department } },
        update: {},
        create: { companyId: company.id, name: department },
      });
      deptCount++;
    }
  }
  log("2-DEPTS", `Seeded ${deptCount} departments`);
  report.processed.departments = deptCount;

  // ──────────────────────────────────────────────────────────
  // 3. Seed dim_employee_status canonical taxonomy
  // ──────────────────────────────────────────────────────────
  const statusRows = [
    { parent: "ACTIVE", childLabel: "Full Time", rehireEligible: false, countsAsHeadcount: true, accruesPto: true, onPayroll: true, onTimeClock: true },
    { parent: "ACTIVE", childLabel: "Part Time", rehireEligible: false, countsAsHeadcount: true, accruesPto: false, onPayroll: true, onTimeClock: true },
    { parent: "ACTIVE", childLabel: "Contractor", rehireEligible: false, countsAsHeadcount: false, accruesPto: false, onPayroll: false, onTimeClock: true },
    { parent: "ON_LEAVE", childLabel: "General", rehireEligible: false, countsAsHeadcount: true, accruesPto: true, onPayroll: true, onTimeClock: false },
    { parent: "INACTIVE", childLabel: "Terminated Rehire Eligible", rehireEligible: true, countsAsHeadcount: false, accruesPto: false, onPayroll: false, onTimeClock: false },
    { parent: "INACTIVE", childLabel: "Terminated No Rehire", rehireEligible: false, countsAsHeadcount: false, accruesPto: false, onPayroll: false, onTimeClock: false },
    { parent: "INACTIVE", childLabel: "Resigned", rehireEligible: true, countsAsHeadcount: false, accruesPto: false, onPayroll: false, onTimeClock: false },
    { parent: "PENDING", childLabel: "Offer Accepted", rehireEligible: false, countsAsHeadcount: false, accruesPto: false, onPayroll: false, onTimeClock: false },
  ];
  let statusCount = 0;
  for (const s of statusRows) {
    await prisma.employeeStatus.upsert({
      where: { parent_childLabel: { parent: s.parent, childLabel: s.childLabel } },
      update: {},
      create: s,
    });
    statusCount++;
  }
  log("3-STATUS", `Seeded ${statusCount} status rows`);
  report.processed.statuses = statusCount;

  // ──────────────────────────────────────────────────────────
  // 4. Seed dim_token (USTR-01..08, UWKS-01..08)
  // ──────────────────────────────────────────────────────────
  const tokenData = [
    { code: "USTR-01", name: "Communication", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-02", name: "Execution", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-03", name: "Judgment", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-04", name: "Ownership", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-05", name: "Adaptability", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-06", name: "Collaboration", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-07", name: "Reliability", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "USTR-08", name: "Growth", polarity: "STRENGTH", layer: "UNIVERSAL" },
    { code: "UWKS-01", name: "Under-Communication", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-02", name: "Execution Drift", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-03", name: "Indecision", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-04", name: "Scope Narrowing", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-05", name: "Rigidity", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-06", name: "Siloing", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-07", name: "Inconsistency", polarity: "GAP", layer: "UNIVERSAL" },
    { code: "UWKS-08", name: "Stagnation", polarity: "GAP", layer: "UNIVERSAL" },
  ];
  let tokenCount = 0;
  for (const t of tokenData) {
    await prisma.token.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
    tokenCount++;
  }
  log("4-TOKENS", `Seeded ${tokenCount} tokens`);
  report.processed.tokens = tokenCount;

  // Load lookup maps for remaining steps
  const roleMap = {};
  const allRoles = await prisma.role.findMany({ where: { companyId: company.id } });
  for (const r of allRoles) roleMap[r.label] = r.id;

  const defaultDept = await prisma.department.findFirst({ where: { companyId: company.id } });
  const deptMap = {};
  const allDepts = await prisma.department.findMany({ where: { companyId: company.id } });
  for (const d of allDepts) deptMap[d.name] = d.id;

  const statusMap = {};
  const allStatuses = await prisma.employeeStatus.findMany();
  for (const s of allStatuses) statusMap[`${s.parent}/${s.childLabel}`] = s.id;

  const tokenMap = {};
  const allTokens = await prisma.token.findMany();
  for (const t of allTokens) tokenMap[t.code] = t.id;

  // ──────────────────────────────────────────────────────────
  // 5. Update each Employee row with HR fields
  // ──────────────────────────────────────────────────────────
  const employees = await prisma.employee.findMany({ where: { companyId: company.id } });
  let empUpdated = 0;
  let empFlagged = 0;

  for (const emp of employees) {
    const name = emp.auditorName || "";
    const parts = name.trim().split(/\s+/);
    let firstName, lastName;

    if (parts.length === 1) {
      firstName = parts[0];
      lastName = "";
      report.flagged.push(`Employee ${emp.auditorId}: single-token name "${name}" — lastName set to empty`);
      empFlagged++;
    } else if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
    } else {
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
      report.flagged.push(`Employee ${emp.auditorId}: multi-token name "${name}" — firstName="${firstName}", lastName="${lastName}"`);
      empFlagged++;
    }

    // Status mapping
    let statusId;
    if (emp.isActive) {
      statusId = statusMap["ACTIVE/Full Time"];
    } else if (emp.departureDate) {
      statusId = statusMap["INACTIVE/Terminated Rehire Eligible"];
    } else {
      statusId = statusMap["INACTIVE/Terminated Rehire Eligible"];
      report.flagged.push(`Employee ${emp.auditorId}: inactive with null departureDate — defaulted to Terminated Rehire Eligible`);
      empFlagged++;
    }

    // Department: use existing value if in deptMap, otherwise default
    const deptId = emp.department && deptMap[emp.department]
      ? deptMap[emp.department]
      : defaultDept?.id || null;

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        firstName,
        lastName,
        roleId: roleMap[emp.role] || null,
        departmentId: deptId,
        statusId,
        employeeTimeZone: "America/Chicago",
        employmentType: "FT",
        source: "internal",
      },
    });
    empUpdated++;
  }
  log("5-EMPLOYEES", `Updated ${empUpdated} employees, ${empFlagged} flagged`);
  report.processed.employeesUpdated = empUpdated;
  report.processed.employeesFlagged = empFlagged;

  // ──────────────────────────────────────────────────────────
  // 6. Create fact_status_change HIRE events
  //    Generate synthetic hireDate for employees without one.
  // ──────────────────────────────────────────────────────────
  let hireEvents = 0;
  let termEvents = 0;
  let hireDatesSynthesized = 0;
  const activeStatusId = statusMap["ACTIVE/Full Time"];

  // Mulberry32 PRNG seeded per operator instruction
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260415);

  // Generate synthetic hireDates: random date between 2020-01-01 and 2025-12-31
  const hireStart = new Date("2020-01-01").getTime();
  const hireEnd = new Date("2025-12-31").getTime();
  const hireRange = hireEnd - hireStart;

  for (const emp of employees) {
    let hireDate = emp.hireDate;
    if (!hireDate) {
      hireDate = new Date(hireStart + Math.floor(rng() * hireRange));
      await prisma.employee.update({
        where: { id: emp.id },
        data: { hireDate },
      });
      hireDatesSynthesized++;
    }

    const existing = await prisma.statusChange.findFirst({
      where: { employeeId: emp.id, authoredBy: "backfill-hr" },
    });
    if (existing) continue;

    await prisma.statusChange.create({
      data: {
        employeeId: emp.id,
        effectiveDate: hireDate,
        toStatusId: activeStatusId,
        reason: "HIRE — synthetic hireDate, not real",
        authoredBy: "backfill-hr",
      },
    });
    hireEvents++;

    if (emp.departureDate) {
      const inactiveStatusId = statusMap["INACTIVE/Terminated Rehire Eligible"];
      await prisma.statusChange.create({
        data: {
          employeeId: emp.id,
          effectiveDate: emp.departureDate,
          fromStatusId: activeStatusId,
          toStatusId: inactiveStatusId,
          reason: "TERMINATION — backfilled from departureDate",
          authoredBy: "backfill-hr",
        },
      });
      termEvents++;
    }
  }
  if (hireDatesSynthesized > 0) {
    report.flagged.push(`Generated synthetic hireDates for ${hireDatesSynthesized} employees (Mulberry32 seed=20260415)`);
  }
  log("6-STATUS-EVENTS", `Created ${hireEvents} HIRE events, ${termEvents} TERMINATION events`);
  report.processed.hireEvents = hireEvents;
  report.processed.termEvents = termEvents;

  // ──────────────────────────────────────────────────────────
  // 7. Create fact_comp_change HIRE events (synthetic rates)
  // ──────────────────────────────────────────────────────────
  const rateByRole = {
    PARTNER: 592800, DIRECTOR: 488800, MANAGER: 405600,
    SENIOR: 301600, STAFF: 197600,
  };
  let compEvents = 0;

  // Re-fetch employees to get updated hireDates from step 6
  const employeesRefreshed = await prisma.employee.findMany({ where: { companyId: company.id } });

  for (const emp of employeesRefreshed) {
    if (!emp.hireDate) continue;

    const existing = await prisma.compChange.findFirst({
      where: { employeeId: emp.id, reason: "synthetic seed — not real compensation data" },
    });
    if (existing) continue;

    const rate = rateByRole[emp.role] || rateByRole.STAFF;
    await prisma.compChange.create({
      data: {
        employeeId: emp.id,
        changeType: "HIRE",
        effectiveDate: emp.hireDate,
        newRate: rate,
        payType: "salary",
        payCadence: "ANNUAL",
        reason: "synthetic seed — not real compensation data",
        authoredBy: "backfill-hr",
      },
    });
    compEvents++;
  }
  log("7-COMP-EVENTS", `Created ${compEvents} HIRE comp events`);
  report.processed.compEvents = compEvents;

  // ──────────────────────────────────────────────────────────
  // 8. Migrate strengthTokens/weaknessTokens → fact_token_assessment
  // ──────────────────────────────────────────────────────────
  let tokenAssessments = 0;

  // Map AuditForge STR-XX → USTR-XX, WKS-XX → UWKS-XX
  function mapTokenCode(code) {
    const trimmed = code.trim();
    if (trimmed.startsWith("STR-")) return "USTR-" + trimmed.slice(4);
    if (trimmed.startsWith("WKS-")) return "UWKS-" + trimmed.slice(4);
    return trimmed;
  }

  for (const emp of employees) {
    const existingCount = await prisma.tokenAssessment.count({
      where: { employeeId: emp.id },
    });
    if (existingCount > 0) continue;

    const now = new Date();

    if (emp.strengthTokens) {
      const codes = emp.strengthTokens.split(",").map(c => c.trim()).filter(Boolean);
      for (const raw of codes) {
        const mapped = mapTokenCode(raw);
        const tId = tokenMap[mapped];
        if (!tId) {
          report.flagged.push(`Employee ${emp.auditorId}: unknown strength token "${raw}" → "${mapped}"`);
          continue;
        }
        await prisma.tokenAssessment.create({
          data: { employeeId: emp.id, tokenId: tId, score: 4, assessedAt: now, assessedBy: "backfill-hr" },
        });
        tokenAssessments++;
      }
    }

    if (emp.weaknessTokens) {
      const codes = emp.weaknessTokens.split(",").map(c => c.trim()).filter(Boolean);
      for (const raw of codes) {
        const mapped = mapTokenCode(raw);
        const tId = tokenMap[mapped];
        if (!tId) {
          report.flagged.push(`Employee ${emp.auditorId}: unknown weakness token "${raw}" → "${mapped}"`);
          continue;
        }
        await prisma.tokenAssessment.create({
          data: { employeeId: emp.id, tokenId: tId, score: 2, assessedAt: now, assessedBy: "backfill-hr" },
        });
        tokenAssessments++;
      }
    }
  }
  log("8-TOKEN-ASSESS", `Created ${tokenAssessments} token assessments`);
  report.processed.tokenAssessments = tokenAssessments;

  // ──────────────────────────────────────────────────────────
  // 9. Create dim_auditor_profile rows
  // ──────────────────────────────────────────────────────────
  let profileCount = 0;

  for (const emp of employees) {
    const existing = await prisma.auditorProfile.findUnique({
      where: { employeeId: emp.id },
    });
    if (existing) continue;

    const indMap = { INTERNAL: "INTERNAL", EXTERNAL: "EXTERNAL", REGULATORY: "REGULATORY" };
    await prisma.auditorProfile.create({
      data: {
        employeeId: emp.id,
        independence: indMap[emp.independence] || null,
        firm: emp.firm || null,
        specializations: emp.specializations ? emp.specializations.split(",").map(s => s.trim()).filter(Boolean) : [],
        bio: emp.bio || null,
        councilSeat: emp.councilSeat || null,
      },
    });
    profileCount++;
  }
  log("9-PROFILES", `Created ${profileCount} auditor profiles`);
  report.processed.auditorProfiles = profileCount;

  // ──────────────────────────────────────────────────────────
  // 10. Backfill User.employeeId by email match
  // ──────────────────────────────────────────────────────────
  const users = await prisma.user.findMany();
  let userMatched = 0;
  let userUnmatched = 0;

  for (const user of users) {
    if (user.employeeId) continue;
    const match = await prisma.employee.findFirst({ where: { email: user.email } });
    if (match) {
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: match.id },
      });
      userMatched++;
    } else {
      report.flagged.push(`User ${user.email}: no matching employee by email`);
      userUnmatched++;
    }
  }
  log("10-USERS", `Matched ${userMatched} users, ${userUnmatched} unmatched`);
  report.processed.usersMatched = userMatched;
  report.processed.usersUnmatched = userUnmatched;

  // ──────────────────────────────────────────────────────────
  // 11. Backfill dim_billing_rate.roleId
  // ──────────────────────────────────────────────────────────
  const billingRates = await prisma.billingRate.findMany({ where: { companyId: company.id } });
  let rateUpdated = 0;

  for (const br of billingRates) {
    if (br.roleId) continue;
    const rId = roleMap[br.role];
    if (rId) {
      await prisma.billingRate.update({
        where: { id: br.id },
        data: { roleId: rId },
      });
      rateUpdated++;
    } else {
      report.flagged.push(`BillingRate ${br.rateId}: no role match for "${br.role}"`);
    }
  }
  log("11-BILLING-RATES", `Updated ${rateUpdated} billing rates with roleId`);
  report.processed.billingRatesUpdated = rateUpdated;

  // ──────────────────────────────────────────────────────────
  // 12. Backfill fact_time_entry.recordedDate = createdAt
  // ──────────────────────────────────────────────────────────
  const teResult = await prisma.$executeRaw`
    UPDATE fact_time_entry SET recorded_date = "createdAt" WHERE recorded_date IS NULL
  `;
  log("12-TIME-ENTRIES", `Backfilled recordedDate on ${teResult} time entries`);
  report.processed.timeEntriesBackfilled = teResult;

  // ──────────────────────────────────────────────────────────
  // REPORT
  // ──────────────────────────────────────────────────────────
  console.log("\n=== BACKFILL COMPLETE ===");
  console.log("\nProcessed:");
  for (const [k, v] of Object.entries(report.processed)) {
    console.log(`  ${k}: ${v}`);
  }
  if (report.flagged.length > 0) {
    console.log(`\nFlagged (${report.flagged.length}):`);
    for (const f of report.flagged) console.log(`  ⚑ ${f}`);
  }
  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    for (const e of report.errors) console.log(`  ✗ ${e}`);
  }
}

main()
  .catch((e) => { console.error("BACKFILL FAILED:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
