// AuditForge — Seed Data: Dropdown Logistics CAE v1.4
// Real data. Real company. Eat your own cooking.
// Run: node prisma/seed.js  (or `npx prisma db seed`)
//
// History:
//   2026-04-11 — Merged seed-v03.js (Dim_ControlType + lifecycle wiring,
//                CR-AUDITFORGE-001 Item 2) and seed-v04.js (Auditor + Audit
//                + scope, CR-AUDITFORGE-004). Source files deleted.
//   2026-04-11 — Removed the merged v04 audit engagement block (AUD-DK-001
//                auditor + AUD-2025-001 base audit + scope) after the DB
//                was cleaned of the legacy AUD-DK-001 duplicate. Audit
//                engagement layer now seeds exclusively via archived
//                scripts under _build-history/.

require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AuditForge with DDL CAE data...");

  // ============================================================
  // ASSERTIONS (PCAOB / COSO)
  // ============================================================
  const assertions = await Promise.all([
    prisma.assertion.upsert({ where: { assertionName: "Occurrence" }, update: {}, create: { assertionName: "Occurrence", category: "TRANSACTION", description: "Transactions and events that have been recorded have occurred and pertain to the entity." } }),
    prisma.assertion.upsert({ where: { assertionName: "Completeness" }, update: {}, create: { assertionName: "Completeness", category: "TRANSACTION", description: "All transactions and events that should have been recorded have been recorded." } }),
    prisma.assertion.upsert({ where: { assertionName: "Accuracy" }, update: {}, create: { assertionName: "Accuracy", category: "TRANSACTION", description: "Amounts and other data relating to recorded transactions and events have been recorded appropriately." } }),
    prisma.assertion.upsert({ where: { assertionName: "Cutoff" }, update: {}, create: { assertionName: "Cutoff", category: "TRANSACTION", description: "Transactions and events have been recorded in the correct accounting period." } }),
    prisma.assertion.upsert({ where: { assertionName: "Classification" }, update: {}, create: { assertionName: "Classification", category: "TRANSACTION", description: "Transactions and events have been recorded in the proper accounts." } }),
    prisma.assertion.upsert({ where: { assertionName: "Existence" }, update: {}, create: { assertionName: "Existence", category: "BALANCE", description: "Assets, liabilities, and equity interests exist at the period end." } }),
    prisma.assertion.upsert({ where: { assertionName: "Rights and Obligations" }, update: {}, create: { assertionName: "Rights and Obligations", category: "BALANCE", description: "The entity holds or controls the rights to assets, and liabilities are the obligations of the entity." } }),
    prisma.assertion.upsert({ where: { assertionName: "Valuation and Allocation" }, update: {}, create: { assertionName: "Valuation and Allocation", category: "BALANCE", description: "Assets, liabilities, and equity interests are included at appropriate amounts." } }),
    prisma.assertion.upsert({ where: { assertionName: "Presentation and Disclosure" }, update: {}, create: { assertionName: "Presentation and Disclosure", category: "DISCLOSURE", description: "Financial information is appropriately presented and described, and disclosures are clearly expressed." } }),
  ]);
  console.log(`Seeded ${assertions.length} assertions`);

  // ============================================================
  // COSO 2013
  // ============================================================
  const cosoComponents = [
    { domain: "Control Environment", requirements: [
      { id: "COSO-CE-01", desc: "The organization demonstrates a commitment to integrity and ethical values." },
      { id: "COSO-CE-02", desc: "The board of directors demonstrates independence from management and exercises oversight." },
      { id: "COSO-CE-03", desc: "Management establishes structures, reporting lines, and appropriate authorities and responsibilities." },
      { id: "COSO-CE-04", desc: "The organization demonstrates commitment to attract, develop, and retain competent individuals." },
      { id: "COSO-CE-05", desc: "The organization holds individuals accountable for their internal control responsibilities." },
    ]},
    { domain: "Risk Assessment", requirements: [
      { id: "COSO-RA-06", desc: "The organization specifies objectives with sufficient clarity to enable risk identification and assessment." },
      { id: "COSO-RA-07", desc: "The organization identifies risks to the achievement of its objectives and analyzes risks." },
      { id: "COSO-RA-08", desc: "The organization considers the potential for fraud in assessing risks." },
      { id: "COSO-RA-09", desc: "The organization identifies and assesses changes that could significantly impact internal control." },
    ]},
    { domain: "Control Activities", requirements: [
      { id: "COSO-CA-10", desc: "The organization selects and develops control activities that contribute to mitigation of risks." },
      { id: "COSO-CA-11", desc: "The organization selects and develops general control activities over technology." },
      { id: "COSO-CA-12", desc: "The organization deploys control activities through policies and procedures." },
    ]},
    { domain: "Information and Communication", requirements: [
      { id: "COSO-IC-13", desc: "The organization obtains or generates and uses relevant, quality information." },
      { id: "COSO-IC-14", desc: "The organization internally communicates information, including objectives and responsibilities." },
      { id: "COSO-IC-15", desc: "The organization communicates with external parties regarding internal control." },
    ]},
    { domain: "Monitoring Activities", requirements: [
      { id: "COSO-MA-16", desc: "The organization performs ongoing and/or separate evaluations of internal control components." },
      { id: "COSO-MA-17", desc: "The organization evaluates and communicates internal control deficiencies in a timely manner." },
    ]},
  ];
  let cosoCount = 0;
  for (const component of cosoComponents) {
    for (const req of component.requirements) {
      await prisma.framework.upsert({
        where: { frameworkName_requirementId: { frameworkName: "COSO 2013", requirementId: req.id } },
        update: {}, create: { frameworkName: "COSO 2013", frameworkVersion: "2013", domain: component.domain, requirementId: req.id, requirementDescription: req.desc },
      });
      cosoCount++;
    }
  }
  console.log(`Seeded ${cosoCount} COSO 2013 requirements`);

  // ============================================================
  // SOX / PCAOB
  // ============================================================
  const soxReqs = [
    { domain: "Section 302", id: "SOX-302-01", desc: "CEO/CFO certification of financial statements and internal controls." },
    { domain: "Section 302", id: "SOX-302-02", desc: "Officers responsible for establishing and maintaining internal controls." },
    { domain: "Section 302", id: "SOX-302-03", desc: "Officers have disclosed all significant deficiencies and material weaknesses." },
    { domain: "Section 404", id: "SOX-404-01", desc: "Management assessment of internal control over financial reporting (ICFR)." },
    { domain: "Section 404", id: "SOX-404-02", desc: "Identification and documentation of significant accounts and disclosures." },
    { domain: "Section 404", id: "SOX-404-03", desc: "Identification of relevant financial statement assertions." },
    { domain: "Section 404", id: "SOX-404-04", desc: "Documentation of controls that address the risk of material misstatement." },
    { domain: "Section 404", id: "SOX-404-05", desc: "Evaluation of design and operating effectiveness of controls." },
    { domain: "Section 404", id: "SOX-404-06", desc: "Assessment of identified control deficiencies." },
    { domain: "Section 906", id: "SOX-906-01", desc: "CEO/CFO criminal certification of SEC compliance." },
    { domain: "PCAOB AS 2201", id: "PCAOB-2201-01", desc: "Planning the audit of internal control over financial reporting." },
    { domain: "PCAOB AS 2201", id: "PCAOB-2201-02", desc: "Using a top-down approach to identify controls to test." },
    { domain: "PCAOB AS 2201", id: "PCAOB-2201-03", desc: "Testing design effectiveness of controls." },
    { domain: "PCAOB AS 2201", id: "PCAOB-2201-04", desc: "Testing operating effectiveness of controls." },
    { domain: "PCAOB AS 2201", id: "PCAOB-2201-05", desc: "Evaluating identified deficiencies." },
  ];
  for (const req of soxReqs) {
    await prisma.framework.upsert({
      where: { frameworkName_requirementId: { frameworkName: "SOX / PCAOB", requirementId: req.id } },
      update: {}, create: { frameworkName: "SOX / PCAOB", frameworkVersion: "2002 / AS 2201", domain: req.domain, requirementId: req.id, requirementDescription: req.desc },
    });
  }
  console.log(`Seeded ${soxReqs.length} SOX/PCAOB requirements`);

  // ============================================================
  // COBIT 2019
  // ============================================================
  const cobitObjs = [
    { domain: "Evaluate, Direct and Monitor (EDM)", id: "COBIT-EDM01", desc: "Ensured Governance Framework Setting and Maintenance." },
    { domain: "Evaluate, Direct and Monitor (EDM)", id: "COBIT-EDM02", desc: "Ensured Benefits Delivery." },
    { domain: "Evaluate, Direct and Monitor (EDM)", id: "COBIT-EDM03", desc: "Ensured Risk Optimization." },
    { domain: "Align, Plan and Organize (APO)", id: "COBIT-APO01", desc: "Managed I&T Management Framework." },
    { domain: "Align, Plan and Organize (APO)", id: "COBIT-APO12", desc: "Managed Risk." },
    { domain: "Align, Plan and Organize (APO)", id: "COBIT-APO13", desc: "Managed Security." },
    { domain: "Build, Acquire and Implement (BAI)", id: "COBIT-BAI05", desc: "Managed Organizational Change." },
    { domain: "Build, Acquire and Implement (BAI)", id: "COBIT-BAI06", desc: "Managed IT Changes." },
    { domain: "Deliver, Service and Support (DSS)", id: "COBIT-DSS01", desc: "Managed Operations." },
    { domain: "Deliver, Service and Support (DSS)", id: "COBIT-DSS05", desc: "Managed Security Services." },
    { domain: "Monitor, Evaluate and Assess (MEA)", id: "COBIT-MEA01", desc: "Managed Performance and Conformance Monitoring." },
    { domain: "Monitor, Evaluate and Assess (MEA)", id: "COBIT-MEA02", desc: "Managed System of Internal Control." },
    { domain: "Monitor, Evaluate and Assess (MEA)", id: "COBIT-MEA03", desc: "Managed Compliance with External Requirements." },
  ];
  for (const obj of cobitObjs) {
    await prisma.framework.upsert({
      where: { frameworkName_requirementId: { frameworkName: "COBIT 2019", requirementId: obj.id } },
      update: {}, create: { frameworkName: "COBIT 2019", frameworkVersion: "2019", domain: obj.domain, requirementId: obj.id, requirementDescription: obj.desc },
    });
  }
  console.log(`Seeded ${cobitObjs.length} COBIT 2019 objectives`);

  // ============================================================
  // COMPANY: Dropdown Logistics
  // ============================================================
  const company = await prisma.company.upsert({
    where: { companyId: "CO-DDL" },
    update: {},
    create: {
      companyId: "CO-DDL",
      name: "Dropdown Logistics",
      industry: "Technology — AI Infrastructure & Governed Operations",
      size: "SMALL",
      publicPrivate: "PRIVATE",
      fiscalYearEnd: "12-31",
      notes: "One-person operations studio. CPA-founded. AI council governance model.",
    },
  });

  const period = await prisma.period.upsert({
    where: { companyId_periodLabel: { companyId: company.id, periodLabel: "FY2025" } },
    update: {},
    create: { companyId: company.id, periodLabel: "FY2025", periodStart: new Date("2025-01-01"), periodEnd: new Date("2025-12-31"), periodType: "ANNUAL" },
  });

  // ============================================================
  // OWNERS (role-based per CAE)
  // ============================================================
  const owners = {};
  const ownerData = [
    { name: "CSO", title: "Chief Standards Officer", department: "Governance" },
    { name: "CEO", title: "Chief Executive Officer", department: "Executive" },
    { name: "CTO", title: "Chief Technology Officer", department: "Technology" },
  ];
  for (const o of ownerData) {
    owners[o.name] = await prisma.owner.upsert({
      where: { companyId_ownerName: { companyId: company.id, ownerName: o.name } },
      update: {}, create: { companyId: company.id, ownerName: o.name, title: o.title, department: o.department },
    });
  }
  console.log(`Seeded ${ownerData.length} owners`);

  // ============================================================
  // PROCESSES (mapped from CAE domains)
  // ============================================================
  const processes = {};
  const processData = [
    { id: "PROC-GOV-001", area: "Governance & Oversight", name: "Framework Governance", sub: "Independent Review", owner: "CSO", cat: "TRADITIONAL" },
    { id: "PROC-PRO-001", area: "Prompt Governance", name: "Prompt Lifecycle", sub: "Version Control & Deployment", owner: "CSO", cat: "AI-NATIVE" },
    { id: "PROC-PRO-002", area: "Prompt Governance", name: "Prompt Validation", sub: "Output Testing & Template Governance", owner: "CSO", cat: "AI-NATIVE" },
    { id: "PROC-CTX-001", area: "Context Integrity", name: "Context Management", sub: "State Verification & Handoff", owner: "CSO", cat: "AI-NATIVE" },
    { id: "PROC-CTX-002", area: "Context Integrity", name: "Context Isolation", sub: "Project Boundary Enforcement", owner: "CSO", cat: "AI-NATIVE" },
    { id: "PROC-HAB-001", area: "Human-AI Boundary", name: "Human Confirmation", sub: "Builder-Confirms-All", owner: "CSO", cat: "AI-NATIVE" },
    { id: "PROC-HAB-002", area: "Human-AI Boundary", name: "Boundary Monitoring", sub: "Awareness & Transparency", owner: "CSO", cat: "AI-NATIVE" },
  ];
  for (const p of processData) {
    processes[p.id] = await prisma.process.upsert({
      where: { companyId_processId: { companyId: company.id, processId: p.id } },
      update: {}, create: {
        companyId: company.id, processId: p.id, processArea: p.area,
        processName: p.name, subprocessName: p.sub, processOwner: p.owner,
        description: `${p.cat} domain. ${p.area} — ${p.name}.`,
      },
    });
  }
  console.log(`Seeded ${processData.length} processes`);

  // ============================================================
  // RISKS (from CAE Risk Registry)
  // ============================================================
  const risks = {};
  const riskData = [
    { id: "RSK-GOV-001", desc: "The DDL Audit Universe framework is not independently reviewed, allowing structural errors, drift, or bias to persist unchallenged. Without periodic independent review, the framework becomes an assertion rather than a governed system.", cat: "STRATEGIC", l: "MEDIUM", i: "HIGH", ir: "HIGH" },
    { id: "RSK-GOV-002", desc: "The Council review process is compromised by prompt design that pre-suggests conclusions, selective model inclusion, or suppression of dissenting verdicts.", cat: "COMPLIANCE", l: "MEDIUM", i: "HIGH", ir: "HIGH" },
    { id: "RSK-GOV-003", desc: "The framework accumulates controls beyond what is operationally manageable, creating compliance overhead that exceeds governance value.", cat: "OPERATIONAL", l: "LOW", i: "MEDIUM", ir: "LOW" },
    { id: "RSK-GOV-004", desc: "DDL operations, framework maintenance, and all control ownership depend on a single individual. Incapacitation, burnout, or departure creates total framework failure.", cat: "STRATEGIC", l: "MEDIUM", i: "CRITICAL", ir: "CRITICAL" },
    { id: "RSK-GOV-005", desc: "Control testing evidence is not retained with defined standards, rendering controls unprovable under audit scrutiny. A control without evidence is an assertion.", cat: "COMPLIANCE", l: "HIGH", i: "MEDIUM", ir: "HIGH" },
    { id: "RSK-PRO-001", desc: "Prompts are deployed to production without version control, review, or approval. Prompt drift causes inconsistent or harmful AI behavior.", cat: "OPERATIONAL", l: "HIGH", i: "HIGH", ir: "CRITICAL" },
    { id: "RSK-PRO-002", desc: "A prompt produces outputs that do not match the intended behavior due to ambiguous instructions, missing constraints, or model interpretation variance.", cat: "OPERATIONAL", l: "MEDIUM", i: "MEDIUM", ir: "MEDIUM" },
    { id: "RSK-PRO-003", desc: "Prompt templates become outdated as DDL methodology evolves, producing outputs that reflect prior-version thinking. Templates drift without governed review.", cat: "OPERATIONAL", l: "MEDIUM", i: "MEDIUM", ir: "MEDIUM" },
    { id: "RSK-CTX-001", desc: "Critical context is lost, truncated, or corrupted during long conversations due to compaction, token limits, or session interruption.", cat: "TECHNOLOGY", l: "HIGH", i: "HIGH", ir: "CRITICAL" },
    { id: "RSK-CTX-002", desc: "Context from one project or conversation contaminates another, causing misattribution, scope confusion, or accidental disclosure.", cat: "COMPLIANCE", l: "MEDIUM", i: "MEDIUM", ir: "MEDIUM" },
    { id: "RSK-CTX-003", desc: "When conversations max out or context transfers between platforms, critical state information is lost because the handoff document is incomplete or not produced.", cat: "OPERATIONAL", l: "HIGH", i: "HIGH", ir: "CRITICAL" },
    { id: "RSK-HAB-001", desc: "An AI-generated artifact or output is treated as canonical without human review. Builder-confirms-all principle is violated.", cat: "STRATEGIC", l: "MEDIUM", i: "CRITICAL", ir: "CRITICAL" },
    { id: "RSK-HAB-002", desc: "As the operator becomes more comfortable with AI outputs, the threshold for human review informally relaxes. Builder confirms all degrades to builder skims most.", cat: "OPERATIONAL", l: "HIGH", i: "HIGH", ir: "CRITICAL" },
    { id: "RSK-HAB-003", desc: "DDL deliverables or published content incorporate material AI-generated content without appropriate disclosure. Stakeholders are misled about production method.", cat: "COMPLIANCE", l: "LOW", i: "HIGH", ir: "MEDIUM" },
  ];
  for (const r of riskData) {
    risks[r.id] = await prisma.risk.upsert({
      where: { companyId_riskId: { companyId: company.id, riskId: r.id } },
      update: {}, create: { companyId: company.id, riskId: r.id, description: r.desc, category: r.cat, likelihood: r.l, impact: r.i, inherentRiskRating: r.ir },
    });
  }
  console.log(`Seeded ${riskData.length} risks`);

  // ============================================================
  // CONTROLS (from CAE Control Object Store)
  // Remapped: GOV.01.01 → CTRL-GOV-001
  // ============================================================
  const controlData = [
    {
      id: "CTRL-GOV-001", processId: "PROC-GOV-001", owner: "CSO",
      desc: "The DDL Audit Universe is reviewed and approved on a quarterly basis by a party independent of the framework author. The Council serves as the independent review body. The review prompt must not pre-suggest conclusions. This control governs the framework itself.",
      type: "DETECTIVE", nature: "MANUAL", freq: "QUARTERLY", key: true,
      risks: ["RSK-GOV-001"],
      assertions: ["Completeness", "Accuracy", "Presentation and Disclosure"],
      frameworks: ["COSO-CE-02", "COSO-MA-16", "COSO-MA-17"],
    },
    {
      id: "CTRL-PRO-001", processId: "PROC-PRO-001", owner: "CSO",
      desc: "All production prompts (boot prompts, Council review prompts, project-specific system prompts) are maintained under version control with a unique version identifier, change date, change description, and author attribution. Prior versions are preserved and retrievable. No prompt is deployed to a production conversation without a current version on file.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-PRO-001"],
      assertions: ["Completeness", "Existence"],
      frameworks: ["COSO-CA-10", "COSO-CA-12", "COSO-IC-13"],
    },
    {
      id: "CTRL-PRO-002", processId: "PROC-PRO-001", owner: "CSO",
      desc: "No prompt is deployed to a production AI conversation without explicit confirmation by the builder. AI models may draft or suggest prompt language; only the builder may authorize deployment. Authorization is recorded as a deployment event with timestamp, prompt version, target platform, and builder confirmation.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-PRO-001"],
      assertions: ["Occurrence", "Rights and Obligations"],
      frameworks: ["COSO-CA-10", "COSO-CE-05"],
    },
    {
      id: "CTRL-PRO-003", processId: "PROC-PRO-002", owner: "CSO",
      desc: "When a prompt is new or materially revised, the builder runs a validation cycle: deploy in a test conversation, evaluate whether output matches intended behavior, and document the result. Validation includes behavioral alignment check, boundary check, and tone/format check.",
      type: "DETECTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-PRO-002"],
      assertions: ["Accuracy", "Valuation and Allocation"],
      frameworks: ["COSO-CA-10", "COSO-MA-16"],
    },
    {
      id: "CTRL-PRO-004", processId: "PROC-PRO-002", owner: "CSO",
      desc: "DDL maintains a governed library of prompt templates with standardized structure, required sections, and naming conventions. Templates are versioned, stored in the designated library, and reviewed for structural compliance when created or materially modified. Non-standard prompts are flagged for template candidacy review.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "QUARTERLY", key: false,
      risks: ["RSK-PRO-001", "RSK-PRO-002", "RSK-PRO-003"],
      assertions: ["Completeness", "Classification"],
      frameworks: ["COSO-CA-12", "COSO-IC-13"],
    },
    {
      id: "CTRL-CTX-001", processId: "PROC-CTX-001", owner: "CSO",
      desc: "At the start of any production conversation that relies on injected context, the builder performs a context verification step: ask the receiving model a calibration question that tests whether critical context was absorbed correctly. If the model fails, re-inject or adjust before proceeding.",
      type: "DETECTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-CTX-001"],
      assertions: ["Existence", "Accuracy"],
      frameworks: ["COSO-CA-10", "COSO-IC-13"],
    },
    {
      id: "CTRL-CTX-002", processId: "PROC-CTX-001", owner: "CSO",
      desc: "When a conversation thread reaches capacity or context must transfer between platforms, the builder produces a structured handoff document capturing: current project state, decisions made, open items, artifacts produced, and context needed to continue without regression. Handoff documents follow standardized format and are versioned.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-CTX-001", "RSK-CTX-003"],
      assertions: ["Completeness", "Accuracy", "Existence"],
      frameworks: ["COSO-CA-10", "COSO-IC-13", "COSO-IC-14"],
    },
    {
      id: "CTRL-CTX-003", processId: "PROC-CTX-002", owner: "CSO",
      desc: "Production conversations maintain project-scoped context boundaries. Context from one project does not bleed into another unless explicitly injected. When multiple projects are discussed in a single thread, the builder declares context boundaries to prevent cross-contamination.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "MONTHLY", key: true,
      risks: ["RSK-CTX-002"],
      assertions: ["Classification", "Rights and Obligations"],
      frameworks: ["COSO-CA-10", "COSO-IC-14"],
    },
    {
      id: "CTRL-HAB-001", processId: "PROC-HAB-001", owner: "CSO",
      desc: "No AI-generated artifact, recommendation, control object, risk statement, or output of material consequence is treated as final without explicit human confirmation by the builder. AI models draft, suggest, analyze, and propose. The builder confirms, approves, rejects, or modifies. This applies to all DDL production contexts.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "MONTHLY", key: true,
      risks: ["RSK-HAB-001"],
      assertions: ["Occurrence", "Rights and Obligations", "Presentation and Disclosure"],
      frameworks: ["COSO-CE-05", "COSO-CA-10", "COSO-IC-14"],
    },
    {
      id: "CTRL-HAB-002", processId: "PROC-HAB-002", owner: "CSO",
      desc: "The builder periodically evaluates whether the boundary between AI suggestion and human decision is being maintained. Reviews whether AI outputs are accepted without substantive review, whether the builder defers judgment to AI, and whether verification steps are performed consistently.",
      type: "DETECTIVE", nature: "MANUAL", freq: "QUARTERLY", key: true,
      risks: ["RSK-HAB-002"],
      assertions: ["Completeness", "Valuation and Allocation"],
      frameworks: ["COSO-MA-16", "COSO-CE-05"],
    },
    {
      id: "CTRL-HAB-003", processId: "PROC-HAB-002", owner: "CSO",
      desc: "All DDL deliverables, published content, and client-facing outputs that incorporate AI-generated or AI-assisted content include appropriate disclosure. Internal artifacts use the generation_method metadata field; client deliverables include a methodology note; published content includes author attribution.",
      type: "PREVENTIVE", nature: "MANUAL", freq: "AD_HOC", key: true,
      risks: ["RSK-HAB-001", "RSK-HAB-003"],
      assertions: ["Presentation and Disclosure", "Rights and Obligations"],
      frameworks: ["COSO-IC-15", "COSO-CE-01"],
    },
  ];

  for (const c of controlData) {
    const control = await prisma.control.upsert({
      where: { companyId_controlId_periodId_version: { companyId: company.id, controlId: c.id, periodId: period.id, version: 1 } },
      update: {},
      create: {
        companyId: company.id, controlId: c.id, processId: processes[c.processId].id,
        periodId: period.id, ownerId: owners[c.owner].id, description: c.desc,
        controlType: c.type, controlNature: c.nature, controlFrequency: c.freq,
        keyControl: c.key, reviewStatus: "DRAFT",
      },
    });

    // Bridge: Control → Risks
    for (const riskId of c.risks) {
      if (risks[riskId]) {
        await prisma.controlRisk.upsert({
          where: { controlId_riskId: { controlId: control.id, riskId: risks[riskId].id } },
          update: {}, create: { controlId: control.id, riskId: risks[riskId].id },
        });
      }
    }

    // Bridge: Control → Assertions
    for (const aName of c.assertions) {
      const assertion = assertions.find((a) => a.assertionName === aName);
      if (assertion) {
        await prisma.controlAssertion.upsert({
          where: { controlId_assertionId: { controlId: control.id, assertionId: assertion.id } },
          update: {}, create: { controlId: control.id, assertionId: assertion.id },
        });
      }
    }

    // Bridge: Control → Frameworks
    for (const fReqId of c.frameworks) {
      const fw = await prisma.framework.findFirst({ where: { requirementId: fReqId } });
      if (fw) {
        await prisma.controlFramework.upsert({
          where: { controlId_frameworkId: { controlId: control.id, frameworkId: fw.id } },
          update: {}, create: { controlId: control.id, frameworkId: fw.id },
        });
      }
    }
  }
  console.log(`Seeded ${controlData.length} controls with bridge mappings`);

  // ============================================================
  // DEFAULT TEMPLATES
  // ============================================================
  await prisma.template.upsert({
    where: { templateId: "TPL-RCM-001" }, update: {},
    create: { templateId: "TPL-RCM-001", name: "Risk Control Matrix", templateType: "RCM", description: "Core mapping of controls to risks, processes, assertions, and frameworks.", outputFormat: "XLSX", version: "1.0.0", definition: { sections: [{ name: "header", fields: ["company_name", "period_label", "generated_date"] }, { name: "matrix", type: "table", sortBy: ["process_area", "control_id"], groupBy: "process_area" }] } },
  });
  await prisma.template.upsert({
    where: { templateId: "TPL-MCL-001" }, update: {},
    create: { templateId: "TPL-MCL-001", name: "Management Control Listing", templateType: "MCL", description: "Complete catalog of all controls with attributes and ownership.", outputFormat: "XLSX", version: "1.0.0", definition: { sections: [{ name: "header", fields: ["company_name", "period_label", "generated_date"] }, { name: "listing", type: "table", sortBy: ["control_id"] }] } },
  });
  await prisma.template.upsert({
    where: { templateId: "TPL-WLK-001" }, update: {},
    create: { templateId: "TPL-WLK-001", name: "Process Walkthrough Narrative", templateType: "WALKTHROUGH", description: "Prose documentation of process flows with embedded control points.", outputFormat: "DOCX", version: "1.0.0", definition: { sections: [{ name: "cover" }, { name: "process_overview", type: "narrative" }, { name: "control_points", type: "numbered_list" }, { name: "risk_summary", type: "table" }] } },
  });
  console.log("Seeded 3 default templates");

  // ============================================================
  // CONTROL TYPE DIMENSION (merged from seed-v03.js, 2026-04-11)
  // CR-AUDITFORGE-001 Item 2 — Dim_ControlType
  // ============================================================
  const typeProfiles = [
    { nature: "PREVENTIVE", automation: "MANUAL",        domain: "BUSINESS", label: "Preventive Manual Business" },
    { nature: "PREVENTIVE", automation: "AUTOMATED",     domain: "IT",       label: "Preventive Automated IT" },
    { nature: "PREVENTIVE", automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Preventive IT-Dependent Hybrid" },
    { nature: "DETECTIVE",  automation: "MANUAL",        domain: "BUSINESS", label: "Detective Manual Business" },
    { nature: "DETECTIVE",  automation: "AUTOMATED",     domain: "IT",       label: "Detective Automated IT" },
    { nature: "DETECTIVE",  automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Detective IT-Dependent Hybrid" },
    { nature: "CORRECTIVE", automation: "MANUAL",        domain: "BUSINESS", label: "Corrective Manual Business" },
    { nature: "CORRECTIVE", automation: "AUTOMATED",     domain: "IT",       label: "Corrective Automated IT" },
    { nature: "CORRECTIVE", automation: "IT_DEPENDENT",  domain: "HYBRID",   label: "Corrective IT-Dependent Hybrid" },
  ];
  for (const profile of typeProfiles) {
    await prisma.controlTypeDim.upsert({
      where: { label: profile.label },
      update: {},
      create: profile,
    });
  }
  console.log(`Seeded ${typeProfiles.length} control type profiles`);

  // Wire DDL controls to ControlTypeDim
  const typeMap = {
    "CTRL-GOV-001": "Detective Manual Business",
    "CTRL-PRO-001": "Preventive Manual Business",
    "CTRL-PRO-002": "Preventive Manual Business",
    "CTRL-PRO-003": "Detective Manual Business",
    "CTRL-PRO-004": "Preventive Manual Business",
    "CTRL-CTX-001": "Detective Manual Business",
    "CTRL-CTX-002": "Preventive Manual Business",
    "CTRL-CTX-003": "Preventive Manual Business",
    "CTRL-HAB-001": "Preventive Manual Business",
    "CTRL-HAB-002": "Detective Manual Business",
    "CTRL-HAB-003": "Preventive Manual Business",
  };
  for (const [controlId, typeLabel] of Object.entries(typeMap)) {
    const typeDim = await prisma.controlTypeDim.findUnique({ where: { label: typeLabel } });
    if (typeDim) {
      await prisma.control.updateMany({
        where: { companyId: company.id, controlId },
        data: { controlTypeDimId: typeDim.id },
      });
    }
  }
  console.log("Wired DDL controls to ControlTypeDim");

  // Set all DDL controls to ACTIVE lifecycle
  await prisma.control.updateMany({
    where: { companyId: company.id },
    data: { lifecycle: "ACTIVE" },
  });
  console.log("Set DDL controls to ACTIVE lifecycle");

  // Note: the v04 audit engagement layer (AUD-DK-001 auditor + AUD-2025-001 base
  // audit + scope rows) was removed 2026-04-11. The audit engagement layer is now
  // seeded exclusively via the archived scripts under _build-history/ (seed-staff,
  // seed-engagements, backfill-tokens). This base seed only creates the dimension
  // and fact data — no auditors, no audits.

  console.log("\n=== SEED COMPLETE ===");
  console.log("Company:       Dropdown Logistics (CO-DDL)");
  console.log("Period:        FY2025");
  console.log("Controls:      11 (GOV, PRO, CTX, HAB domains)");
  console.log("Risks:         14 (16 in CAE, 2 unmapped — RSK-GOV-003, RSK-GOV-004)");
  console.log("Processes:     7 (mapped from 4 active CAE domains)");
  console.log("Owners:        3 (CSO, CEO, CTO — role-based)");
  console.log("Frameworks:    COSO 2013 (17), SOX/PCAOB (15), COBIT 2019 (13)");
  console.log("Assertions:    9 (PCAOB)");
  console.log("Templates:     3 (RCM, MCL, Walkthrough)");
  console.log("ControlTypes:  9 (3 nature × 3 automation matrix)");
  console.log("\nAudit engagement layer (auditors, audits, scope) must be seeded separately");
  console.log("via _build-history/seed-staff.js + seed-engagements.js + backfill-tokens.js");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
