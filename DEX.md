# DEX.md — AuditForge

Context status: **current**
Last reviewed: 2026-04-17
DEX.md version: 1.0
Token budget: ~2,800 (target 3,000 / hard cap 4,000)

---

## 1. Project Identity

**AuditForge** — Governed audit document generation from structured control and risk data.

- Repo: `github.com/dropdownlogistics/auditforge`
- URL: `auditforge.dev` (Vercel auto-deploy from main)
- Schema: v0.4 (CR-AUDITFORGE-004 ratified)
- Status: Live production. Seed data populated. UI complete through Audits view.
- Bundle position: Bundle Zero on future WorkBench substrate
- Sibling projects: DDL site (`website` repo), BlindSpot Bet (`blindspot-bet`), dex-rag (corpus/RAG)

Related CRs: CR-AUDITFORGE-001 (schema v0.3), CR-AUDITFORGE-003 (analytics), CR-AUDITFORGE-004 (audit planning layer)

---

## 2. Architectural State

**Stack:** Next.js 16.1 (App Router) · PostgreSQL 17 (Neon) · Prisma 6.19 · Vercel · ExcelJS + docx npm

**Schema (star schema, Fact_Control at center):**

Dimensions:
- `dim_company` — multi-company scoping (all queries company-scoped)
- `dim_process` — 3-level hierarchy (Area / Process / Subprocess)
- `dim_risk` — risk inventory with category + likelihood/impact ratings
- `dim_owner` — control ownership (first-class dimension)
- `dim_framework` — COSO 2013, SOX/PCAOB, COBIT 2019 seeded
- `dim_assertion` — 9 PCAOB assertions
- `dim_control_type` — 9 profiles (nature × automation × domain)
- `dim_period` — fiscal periods
- `dim_scope` — entity/BU/location
- `dim_auditor` [v0.4] — separated from owners (independence requirement)

Facts:
- `fact_control` — grain: one control per company per period per version
- `fact_audit` [v0.4] — planning layer (PLANNING → FIELDWORK → REPORTING → COMPLETED)

Bridges (all M:M, effective-dated with validFrom/validTo):
- `bridge_control_risk`, `bridge_control_framework`, `bridge_control_assertion`
- `bridge_audit_control` [v0.4] — audit scope with rationale + assignee

System tables: `sys_control_status_log` (workflow), `sys_audit_trail` (immutable mutation log), `sys_template`, `sys_generated_document`

**Modules shipped:** Dashboard, Analytics (CR-003 KPIs), Controls CRUD, Risks CRUD, Processes CRUD, Audits (v0.4), Generate (RCM/MCL/WLK/AuditPlan), Import (3-step with preview), Global Search (Cmd+K)

**Modules planned/pending:** HR+Payroll bundle integration, site wing (5 pages on DDL site), evidence vault (deferred by council)

**Key FKs:** Every fact/bridge table FK chains through `companyId`. `fact_audit.leadAuditorId` → `dim_auditor`. `bridge_audit_control.assignedToId` → `dim_auditor`. Control versioning via `supersededById` self-ref.

---

## 3. Design Constraints

**Design system:** CottageHumble dark — navy `#0D1B2A` bg, card `#10202f`, cream `#F5F1EB` text, crimson `#B23531` brand, amber `#C49A3C` interactive, green `#4A9E6B` positive. Space Grotesk / JetBrains Mono / Source Serif 4. No white. No light mode.

**Ratified invariants:**
- System of Structure boundary — AuditForge does not issue opinions or test controls (ratified CR-001)
- Silent Fix Prevention — every mutation requires documented rationale
- Segregation of duties — prepared_by != reviewed_by
- Company data isolation — all queries scoped to companyId, no cross-company leaks
- Audit trail immutability — every mutation logged with actor, timestamp, field diffs
- AI layer deferred — core must function without it (council decision)
- Evidence vault deferred — references only, no artifact storage (council decision)

**Standards:** STD-WB-MEASURE-001 (when WorkBench substrate exists), STD-DDL-ANTIPAT-001 (no vanity metrics per CR-003)

**Naming:** `dim_` prefix on dimensions, `fact_` on facts, `bridge_` on bridges, `sys_` on system tables. Natural IDs on all entities (CTRL-GOV-001 pattern). API routes at `/api/{entity}`. resolveCompanyId() for natural ID resolution.

**Anti-patterns:** No `except: pass`. No cross-company queries. No mutations without AuditTrail. No schema changes without council review. No features that blur the Structure boundary.

---

## 4. Current Work Surface

- [ratified] Schema v0.4 shipped (Dim_Auditor, Fact_Audit, Bridge_Audit_Control)
- [ratified] Analytics KPIs live per CR-AUDITFORGE-003
- [pending] HR+Payroll bundle integration UI — first design-then-implement pipeline test
- [pending] Site wing — 5 pages on DDL site, routing TBD
- [exploratory] WorkBench substrate positioning — AuditForge as Bundle Zero
- [pending] Prod data population — 14 DDL risks in seed, not yet imported via UI

**Operator priority:** HR+Payroll bundle integration UI is the current design target.

---

## 5. Output Contract

**Dex Jr. produces:** Component specs, schema proposals, UI layouts, architectural recommendations — structured as DESIGNSPEC handoff artifacts.

**Dex Jr. does NOT produce:** Production code (CC's job), final copy, audit opinions, schema migrations.

**Detail level:** Enough for CC to implement without re-asking Dex Jr. Component names, props, data flow, constraints, acceptance criteria.

**Handoff format:** DESIGNSPEC (see template in repo or CLAUDE.md). Sections: Objective / Artifact Type / Proposed Design / Constraints / Acceptance Criteria / References. Include DEX.md version date in References.

**Conflict rule:** CLAUDE.md governs build execution. DEX.md governs design constraints. Repo reality wins for implementation facts. Ratified CRs win for governance facts. Operator may override either.
