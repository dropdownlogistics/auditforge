"use client";

import { LayoutDashboard, BarChart2, Shield, AlertTriangle, Network, BookOpen, FileOutput, Upload } from "lucide-react";

import { useState, useEffect } from "react";

// ── CottageHumble Tokens ──
const C = {
  navy: "#0D1B2A", card: "#10202f", cream: "#F5F1EB", copper: "#C49A3C",
  crimson: "#B23531", green: "#22C55E", blue: "#6B9DC2", slate: "#4A5568",
  steel: "#6B7B8D", border: "rgba(245,241,235,0.06)", borderLight: "rgba(245,241,235,0.04)",
  warn: "#F59E0B", warnBg: "rgba(245,158,11,0.08)", warnBorder: "rgba(245,158,11,0.25)",
};

const RISK_BG = { CRITICAL: "#FCA5A5", HIGH: "#FECACA", MEDIUM: "#FEF3C7", LOW: "#D1FAE5" };
const STATUS_BG = { DRAFT: "#FEF3C7", PREPARED: "#DBEAFE", REVIEWED: "#E0E7FF", APPROVED: "#D1FAE5" };
const TYPE_BG = { PREVENTIVE: "#DBEAFE", DETECTIVE: "#FEF3C7", CORRECTIVE: "#FECACA" };
const AUDIT_BG = { PLANNING: "#DBEAFE", FIELDWORK: "#FEF3C7", REPORTING: "#E0E7FF", COMPLETED: "#D1FAE5", CANCELLED: "#FECACA" };

function fmtEnum(v) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""; }
function Badge({ children, bg }) { return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, background: bg || "#F3F4F6", color: "#0D1B2A" }}>{children}</span>; }

// ── Main App ──
export default function AuditForgeApp() {
  const [view, setView] = useState("dashboard");
  const { open: searchOpen, setOpen: setSearchOpen, query: searchQuery, setQuery: setSearchQuery } = useGlobalSearch(controls, risks, processes);
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ctrlRes, riskRes, procRes, auditRes] = await Promise.all([
          fetch("/api/controls?companyId=CO-DDL"),
          fetch("/api/risks?companyId=CO-DDL"),
          fetch("/api/processes?companyId=CO-DDL"),
          fetch("/api/audits?companyId=CO-DDL").catch(() => ({ json: async () => ({ audits: [] }) })),
        ]);
        const [ctrlData, riskData, procData, auditData] = await Promise.all([ctrlRes.json(), riskRes.json(), procRes.json(), auditRes.json()]);
        setControls(ctrlData.controls || []);
        setRisks(riskData.risks || []);
        setProcesses(procData.processes || []);
        setAudits(auditData.audits || []);
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const NAV = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "controls", icon: Shield, label: "Controls" },
    { id: "risks", icon: AlertTriangle, label: "Risks" },
    { id: "processes", icon: Network, label: "Processes" },
    { id: "audits", icon: BookOpen, label: "Audits" },
    { id: "generate", icon: FileOutput, label: "Generate" },
    { id: "import", icon: Upload, label: "Import" },
  ];

  const draftCount = controls.filter(c => c.reviewStatus === "DRAFT").length;
  const approvedCount = controls.filter(c => c.reviewStatus === "APPROVED").length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <nav style={{ width: 240, minWidth: 240, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream }}>AuditForge</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.05em", marginTop: 4 }}>GOVERNED DOCUMENTATION</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          <div onClick={() => setSearchOpen(true)} style={{ margin: "0 12px 8px", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,241,235,0.08)", cursor: "pointer" }}>
            <span style={{ color: "#4a6080", fontSize: 13 }}>?</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4a6080", flex: 1 }}>Search...</span>
            <kbd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px" }}>?K</kbd>
          </div>
          <div style={{ padding: "16px 12px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, letterSpacing: "0.1em" }}>NAVIGATION</div>
          {NAV.map(n => (
            <div key={n.id} onClick={() => n.id === "import" ? window.location.href = "/import" : setView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13,
              fontWeight: view === n.id ? 600 : 400,
              color: view === n.id ? C.cream : C.steel,
              background: view === n.id ? "rgba(196,154,60,0.1)" : "transparent",
              borderLeft: view === n.id ? `2px solid ${C.copper}` : "2px solid transparent",
            }}>
              <n.icon size={16} style={{ minWidth: 16 }} />
              {n.label}
              {n.id === "audits" && audits.length > 0 && <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{audits.length}</span>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.slate, lineHeight: 1.6 }}>
            Dropdown Logistics<br />Chaos → Structured → Automated
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.copper, marginTop: 8 }}>CO-DDL · FY2025 · v0.4</div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", background: C.navy }}>
        {/* Grey's Governance Fix: Warning banner when controls are in DRAFT */}
        {!loading && draftCount > 0 && (
          <div style={{
            padding: "10px 32px", background: C.warnBg, borderBottom: `1px solid ${C.warnBorder}`,
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.warn,
          }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span><strong>{draftCount} of {controls.length}</strong> controls in DRAFT — {approvedCount} approved. Generated documents will be stamped as draft governance state.</span>
          </div>
        )}

        {view === "dashboard" && <DashboardView controls={controls} risks={risks} processes={processes} audits={audits} loading={loading} />}
        {view === "analytics" && <AnalyticsView controls={controls} risks={risks} loading={loading} />}
        {view === "controls" && <ControlsView controls={controls} loading={loading} />}
        {view === "risks" && <RisksView risks={risks} controls={controls} loading={loading} />}
        {view === "processes" && <ProcessesView processes={processes} controls={controls} loading={loading} />}
        {view === "audits" && <AuditsView audits={audits} controls={controls} loading={loading} />}
        {view === "generate" && <GenerateView controls={controls} />}
        
      </main>
    </div>
  );
}

// ── Header ──
function Header({ title, meta, children }) {
  return (
    <div style={{ padding: "24px 32px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream }}>{title}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginTop: 2 }}>{meta}</div>
      </div>
      {children}
    </div>
  );
}

// ── Dashboard ──
function DashboardView({ controls, risks, processes, audits, loading }) {
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.steel }}>Loading...</div>;

  const keyControls = controls.filter(c => c.keyControl).length;
  const criticalRisks = risks.filter(r => r.inherentRiskRating === "CRITICAL").length;
  const draftControls = controls.filter(c => c.reviewStatus === "DRAFT").length;

  const byType = {}; controls.forEach(c => { byType[c.controlType] = (byType[c.controlType] || 0) + 1; });
  const byArea = {}; controls.forEach(c => { const a = c.process?.processArea || "Unknown"; byArea[a] = (byArea[a] || 0) + 1; });
  const byStatus = {}; controls.forEach(c => { byStatus[c.reviewStatus] = (byStatus[c.reviewStatus] || 0) + 1; });
  const byRisk = {}; risks.forEach(r => { byRisk[r.inherentRiskRating] = (byRisk[r.inherentRiskRating] || 0) + 1; });

  return (
    <>
      <Header title="Dashboard" meta={`Dropdown Logistics · FY2025 · ${controls.length} controls · ${risks.length} risks`} />
      <div style={{ padding: "24px 32px 48px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "TOTAL CONTROLS", value: controls.length, accent: C.copper },
            { label: "KEY CONTROLS", value: keyControls, accent: C.green },
            { label: "CRITICAL RISKS", value: criticalRisks, accent: C.crimson },
            { label: "PROCESSES", value: processes.length, accent: C.blue },
            { label: "IN DRAFT", value: draftControls, accent: C.warn },
            { label: "ACTIVE AUDITS", value: audits.filter(a => a.status !== "COMPLETED" && a.status !== "CANCELLED").length, accent: "#8a6cc9" },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ width: 32, height: 3, background: s.accent, borderRadius: 2, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: C.cream }}>{s.value}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Breakdowns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { title: "BY CONTROL TYPE", items: Object.entries(byType).map(([k, v]) => ({ label: <Badge bg={TYPE_BG[k]}>{fmtEnum(k)}</Badge>, value: v })) },
            { title: "BY PROCESS AREA", items: Object.entries(byArea).map(([k, v]) => ({ label: k, value: v })) },
            { title: "BY REVIEW STATUS", items: Object.entries(byStatus).map(([k, v]) => ({ label: <Badge bg={STATUS_BG[k]}>{fmtEnum(k)}</Badge>, value: v })) },
            { title: "RISK HEAT MAP", items: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(r => ({ label: <Badge bg={RISK_BG[r]}>{r}</Badge>, value: byRisk[r] || 0 })) },
          ].map(card => (
            <div key={card.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 12 }}>{card.title}</div>
              {card.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                  <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.cream }}>{item.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.cream }}>{item.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Controls ──
function ControlsView({ controls, loading }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;

  let filtered = controls;
  if (typeFilter !== "ALL") filtered = filtered.filter(c => c.controlType === typeFilter);
  if (statusFilter !== "ALL") filtered = filtered.filter(c => c.reviewStatus === statusFilter);
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(c => c.controlId.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)); }

  return (
    <>
      <Header title="Controls" meta={`${filtered.length} of ${controls.length} controls`} />
      <div style={{ padding: "24px 32px 48px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search controls..." style={{ background: C.card, border: `1px solid rgba(245,241,235,0.1)`, borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, outline: "none", minWidth: 200 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: C.card, border: `1px solid rgba(245,241,235,0.1)`, borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream }}>
            <option value="ALL">All Types</option><option value="PREVENTIVE">Preventive</option><option value="DETECTIVE">Detective</option><option value="CORRECTIVE">Corrective</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: C.card, border: `1px solid rgba(245,241,235,0.1)`, borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream }}>
            <option value="ALL">All Status</option><option value="DRAFT">Draft</option><option value="PREPARED">Prepared</option><option value="REVIEWED">Reviewed</option><option value="APPROVED">Approved</option>
          </select>
        </div>
        <ControlTable controls={filtered} />
      </div>
    </>
  );
}

function ControlTable({ controls }) {
  const sorted = [...controls].sort((a, b) => { const aa = a.process?.processArea || ""; const bb = b.process?.processArea || ""; return aa !== bb ? aa.localeCompare(bb) : a.controlId.localeCompare(b.controlId); });
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <thead><tr>
          {["Control ID", "Description", "Area", "Type", "Key", "Owner", "Status", "Risks"].map(h => (
            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.cream, background: C.navy, borderBottom: `2px solid ${C.copper}`, whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr key={c.id || i}>
              <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.cream, borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.controlId}</td>
              <td style={{ padding: "12px 16px", fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream, borderBottom: `1px solid ${C.borderLight}`, maxWidth: 350, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.description?.substring(0, 150)}{c.description?.length > 150 ? "..." : ""}</td>
              <td style={{ padding: "12px 16px", fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.process?.processArea}</td>
              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}><Badge bg={TYPE_BG[c.controlType]}>{fmtEnum(c.controlType)}</Badge></td>
              <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.keyControl ? <span style={{ color: C.green, fontWeight: 700 }}>●</span> : <span style={{ color: C.slate }}>○</span>}</td>
              <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.owner?.ownerName || "—"}</td>
              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}><Badge bg={STATUS_BG[c.reviewStatus]}>{fmtEnum(c.reviewStatus)}</Badge></td>
              <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.crimson, borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.risks?.map(r => r.risk?.riskId).filter(Boolean).join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Risks ──
function RisksView({ risks, controls, loading }) {
  const [ratingFilter, setRatingFilter] = useState("ALL");
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;
  let filtered = risks; if (ratingFilter !== "ALL") filtered = filtered.filter(r => r.inherentRiskRating === ratingFilter);
  const riskControlMap = {}; controls.forEach(c => { (c.risks || []).forEach(cr => { const rId = cr.risk?.riskId; if (rId) riskControlMap[rId] = (riskControlMap[rId] || 0) + 1; }); });

  return (
    <>
      <Header title="Risk Registry" meta={`${filtered.length} of ${risks.length} risks`} />
      <div style={{ padding: "24px 32px 48px" }}>
        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ background: C.card, border: `1px solid rgba(245,241,235,0.1)`, borderRadius: 6, padding: "6px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, marginBottom: 20 }}>
          <option value="ALL">All Ratings</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
        </select>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <thead><tr>{["Risk ID", "Description", "Category", "Likelihood", "Impact", "Rating", "Controls"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.cream, background: C.navy, borderBottom: `2px solid ${C.copper}` }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.sort((a, b) => a.riskId.localeCompare(b.riskId)).map((r, i) => (
              <tr key={r.id || i}>
                <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.crimson, borderBottom: `1px solid ${C.borderLight}` }}>{r.riskId}</td>
                <td style={{ padding: "12px 16px", fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream, borderBottom: `1px solid ${C.borderLight}`, maxWidth: 400 }}>{r.description}</td>
                <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, borderBottom: `1px solid ${C.borderLight}` }}>{fmtEnum(r.category)}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.cream, borderBottom: `1px solid ${C.borderLight}` }}>{fmtEnum(r.likelihood)}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.cream, borderBottom: `1px solid ${C.borderLight}` }}>{fmtEnum(r.impact)}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}><Badge bg={RISK_BG[r.inherentRiskRating]}>{r.inherentRiskRating}</Badge></td>
                <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.cream, textAlign: "center", borderBottom: `1px solid ${C.borderLight}` }}>{riskControlMap[r.riskId] || 0}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Processes ──
function ProcessesView({ processes, controls, loading }) {
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;
  const areas = {}; processes.forEach(p => { if (!areas[p.processArea]) areas[p.processArea] = []; areas[p.processArea].push(p); });
  const ctrlCounts = {}; controls.forEach(c => { const pid = c.process?.processId; if (pid) ctrlCounts[pid] = (ctrlCounts[pid] || 0) + 1; });

  return (
    <>
      <Header title="Processes" meta={`${Object.keys(areas).length} areas · ${processes.length} processes`} />
      <div style={{ padding: "24px 32px 48px" }}>
        {Object.entries(areas).map(([area, procs]) => (
          <div key={area} style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 16 }}>{area.toUpperCase()}</div>
            {procs.map(p => (
              <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.cream }}>{p.processName}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.slate, marginTop: 4 }}>{p.processId} · Owner: {p.processOwner} · {ctrlCounts[p.processId] || 0} controls</div>
                {p.description && <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, marginTop: 8 }}>{p.description}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Audits (v0.4) ──
function AuditsView({ audits, controls, loading }) {
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;

  return (
    <>
      <Header title="Audit Engagements" meta={`${audits.length} audit(s) · v0.4 Planning Layer`} />
      <div style={{ padding: "24px 32px 48px" }}>
        {audits.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: C.steel, fontFamily: "'Source Serif 4', serif" }}>No audits found. Seed with: node prisma/seed-v04.js</div>
        ) : audits.map(audit => {
          const scopeItems = audit.controlScope || [];
          const inScope = scopeItems.filter(s => s.inScope);
          const keyInScope = inScope.filter(s => s.control?.keyControl);
          const areas = [...new Set(inScope.map(s => s.control?.process?.processArea).filter(Boolean))];

          return (
            <div key={audit.id} style={{ marginBottom: 32 }}>
              {/* Audit Header Card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.copper }}>{audit.auditId}</span>
                      <Badge bg={AUDIT_BG[audit.status]}>{fmtEnum(audit.status)}</Badge>
                      <Badge bg={TYPE_BG.DETECTIVE}>{fmtEnum(audit.auditType)}</Badge>
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: C.cream }}>{audit.auditName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>Lead Auditor</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.cream }}>{audit.leadAuditor?.auditorName}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{audit.leadAuditor?.certifications}</div>
                  </div>
                </div>

                {/* Audit Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  {[
                    { label: "IN SCOPE", value: inScope.length, accent: C.copper },
                    { label: "KEY CONTROLS", value: keyInScope.length, accent: C.green },
                    { label: "PROCESS AREAS", value: areas.length, accent: C.blue },
                    { label: "PERIOD", value: audit.period?.periodLabel || "—", accent: "#8a6cc9" },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ width: 24, height: 2, background: s.accent, borderRadius: 1, marginBottom: 8 }} />
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream }}>{s.value}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.05em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {audit.methodology && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, marginBottom: 4 }}>METHODOLOGY</div>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, lineHeight: 1.6 }}>{audit.methodology}</div>
                  </div>
                )}
              </div>

              {/* Scope Table */}
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 12 }}>SCOPE MATRIX</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <thead><tr>{["Control ID", "Description", "Area", "Scope", "Assigned To", "Target Date", "Review Status"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.cream, background: C.navy, borderBottom: `2px solid ${C.copper}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {scopeItems.sort((a, b) => (a.control?.controlId || "").localeCompare(b.control?.controlId || "")).map((s, i) => (
                      <tr key={s.id || i}>
                        <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.cream, borderBottom: `1px solid ${C.borderLight}` }}>{s.control?.controlId}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.cream, borderBottom: `1px solid ${C.borderLight}`, maxWidth: 300 }}>{s.control?.description?.substring(0, 100)}...</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: C.steel, borderBottom: `1px solid ${C.borderLight}` }}>{s.control?.process?.processArea}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}><Badge bg={s.inScope ? "#D1FAE5" : "#FECACA"}>{s.scopeDecision ? fmtEnum(s.scopeDecision) : (s.inScope ? "In Scope" : "Out")}</Badge></td>
                        <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, borderBottom: `1px solid ${C.borderLight}` }}>{s.assignedTo?.auditorName || "Unassigned"}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, borderBottom: `1px solid ${C.borderLight}` }}>{s.targetDate ? new Date(s.targetDate).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}><Badge bg={STATUS_BG[s.control?.reviewStatus]}>{fmtEnum(s.control?.reviewStatus)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Download Audit Plan */}
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <a href={`/api/generate/download?type=AUDIT_PLAN&companyId=CO-DDL&auditId=${audit.auditId}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px",
                  background: C.copper, color: C.navy, borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13, fontWeight: 600, textDecoration: "none", cursor: "pointer",
                }}>↓ Download Audit Plan</a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Generate (with download buttons + Grey's governance stamp) ──
function GenerateView({ controls }) {
  const [downloading, setDownloading] = useState(null);
  const draftCount = controls.filter(c => c.reviewStatus === "DRAFT").length;
  const processAreas = [...new Set(controls.map(c => c.process?.processArea).filter(Boolean))];

  const DOC_TYPES = [
    { id: "RCM", label: "Risk Control Matrix", ext: "XLSX", desc: "Full RCM with cover, matrix, and summary. Maps controls to risks, frameworks, and assertions.", icon: "◫" },
    { id: "MCL", label: "Master Control List", ext: "XLSX", desc: "Complete control catalog with status breakdown by review state, type, and nature.", icon: "◧" },
    { id: "AUDIT_PLAN", label: "Audit Plan", ext: "XLSX", desc: "Cover, scope matrix, timeline. Controls in scope with assignments and target dates.", icon: "◈" },
  ];

  function handleDownload(type, extra) {
    setDownloading(type);
    const url = `/api/generate/download?type=${type}&companyId=CO-DDL${extra || ""}`;
    const a = document.createElement("a"); a.href = url; a.click();
    setTimeout(() => setDownloading(null), 2000);
  }

  return (
    <>
      <Header title="Generate Documents" meta="Select a document type to generate and download from live data" />
      <div style={{ padding: "24px 32px 48px" }}>

        {/* Grey's Fix: Governance state warning on generate page */}
        {draftCount > 0 && (
          <div style={{
            background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 8,
            padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 20, color: C.warn }}>⚠</span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.warn }}>Governance State: {draftCount} of {controls.length} controls in DRAFT</div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, marginTop: 4 }}>Generated documents will include a "Document Status: DRAFT" stamp. Approve all source controls to generate production-grade output.</div>
            </div>
          </div>
        )}

        {/* Document cards */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 16 }}>DOCUMENT TYPE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
          {DOC_TYPES.map(doc => (
            <div key={doc.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{doc.icon}</span>
                <Badge bg="rgba(196,154,60,0.15)">{doc.ext}</Badge>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.cream, marginBottom: 8 }}>{doc.label}</div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, lineHeight: 1.5, marginBottom: 16 }}>{doc.desc}</div>
              <button onClick={() => handleDownload(doc.id)} style={{
                width: "100%", padding: "10px 0", background: C.copper, color: C.navy, border: "none",
                borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{downloading === doc.id ? "↓ Downloading..." : `↓ Generate & Download`}</button>
            </div>
          ))}
        </div>

        {/* Walkthroughs by area */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 16 }}>WALKTHROUGH NARRATIVES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
          {processAreas.map(area => (
            <div key={area} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: C.cream, marginBottom: 4 }}>{area}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginBottom: 12 }}>{controls.filter(c => c.process?.processArea === area).length} controls · DOCX</div>
              <button onClick={() => handleDownload("WALKTHROUGH", `&processArea=${encodeURIComponent(area)}`)} style={{
                width: "100%", padding: "8px 0", background: "transparent", color: C.copper, border: `1px solid ${C.copper}`,
                borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{downloading === "WALKTHROUGH" ? "↓ ..." : "↓ Download"}</button>
            </div>
          ))}
        </div>

        {/* DDL Standards */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 16 }}>DDL STANDARDS APPLIED</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {["6px frame (Row 1 / Col A)", "Grid lines off", "DDL footer on every page", "Space Grotesk headings", "JetBrains Mono for data", "Source Serif 4 for body", "Copper accent dividers", "Navy header bars", "Sheet protection", "Frozen panes", "Print area configured", "Branded cover sheet"].map(item => (
            <div key={item} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, padding: "6px 0" }}>
              <span style={{ color: C.green, marginRight: 6 }}>✓</span>{item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}












// ── Analytics View ────────────────────────────────────────────────────────────
// Add to NAV array: { id: "analytics", icon: "◈", label: "Analytics" }
// Add to view render: {view === "analytics" && <AnalyticsView controls={controls} risks={risks} />}

function AnalyticsView({ controls, risks, loading }) {
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;

  // ── Computed metrics ──────────────────────────────────────────────────────

  // 1. Risk coverage — risks with at least one mapped control
  const allRiskIds = risks.map(r => r.riskId);
  const mappedRiskIds = new Set(
    controls.flatMap(c => (c.risks || []).map(r => r.risk?.riskId).filter(Boolean))
  );
  const coveredRisks   = allRiskIds.filter(id => mappedRiskIds.has(id)).length;
  const uncoveredRisks = allRiskIds.filter(id => !mappedRiskIds.has(id));
  const coverageRate   = risks.length > 0 ? Math.round((coveredRisks / risks.length) * 100) : 100;

  // 2. Unmitigated critical/high risks
  const unmitigated = risks.filter(r =>
    ["CRITICAL", "HIGH"].includes(r.inherentRiskRating) && !mappedRiskIds.has(r.riskId)
  );

  // 3. Key control testing deficit
  const keyControls      = controls.filter(c => c.keyControl);
  const keyNotTested     = keyControls.filter(c => c.operatingEffectiveness === "NOT_TESTED").length;
  const keyIneffective   = keyControls.filter(c => c.operatingEffectiveness === "INEFFECTIVE").length;
  const keyEffective     = keyControls.filter(c => c.operatingEffectiveness === "EFFECTIVE").length;
  const keyPartial       = keyControls.filter(c => c.operatingEffectiveness === "PARTIALLY_EFFECTIVE").length;

  // 4. Controls awaiting review (DRAFT or PREPARED)
  const awaitingReview = controls.filter(c => ["DRAFT", "PREPARED"].includes(c.reviewStatus)).length;

  // 5. Review status funnel
  const statusCounts = {
    DRAFT:    controls.filter(c => c.reviewStatus === "DRAFT").length,
    PREPARED: controls.filter(c => c.reviewStatus === "PREPARED").length,
    REVIEWED: controls.filter(c => c.reviewStatus === "REVIEWED").length,
    APPROVED: controls.filter(c => c.reviewStatus === "APPROVED").length,
  };

  // 6. Control health heatmap (risk rating × operating effectiveness)
  const RATINGS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const EFF     = ["EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE", "NOT_TESTED"];
  const heatmap = {};
  RATINGS.forEach(r => {
    heatmap[r] = {};
    EFF.forEach(e => { heatmap[r][e] = 0; });
  });
  controls.forEach(ctrl => {
    (ctrl.risks || []).forEach(cr => {
      const rating = cr.risk?.inherentRiskRating;
      const eff    = ctrl.operatingEffectiveness;
      if (rating && eff && heatmap[rating] && heatmap[rating][eff] !== undefined) {
        heatmap[rating][eff]++;
      }
    });
  });

  // 7. Nature vs Type matrix
  const TYPES   = ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"];
  const NATURES = ["MANUAL", "AUTOMATED", "IT_DEPENDENT_MANUAL"];
  const matrix  = {};
  TYPES.forEach(t => { matrix[t] = {}; NATURES.forEach(n => { matrix[t][n] = 0; }); });
  controls.forEach(c => {
    if (matrix[c.controlType] && c.controlNature) {
      matrix[c.controlType][c.controlNature] = (matrix[c.controlType][c.controlNature] || 0) + 1;
    }
  });

  // 8. Control density by process area
  const byArea = {};
  controls.forEach(c => {
    const area = c.process?.processArea || "Unknown";
    byArea[area] = (byArea[area] || 0) + 1;
  });
  const maxAreaCount = Math.max(...Object.values(byArea), 1);

  // ── Heatmap cell color ────────────────────────────────────────────────────
  function heatColor(rating, eff, count) {
    if (count === 0) return "rgba(255,255,255,0.03)";
    if (eff === "EFFECTIVE") return `rgba(74,158,107,${Math.min(0.15 + count * 0.12, 0.7)})`;
    if (eff === "PARTIALLY_EFFECTIVE") return `rgba(196,154,60,${Math.min(0.15 + count * 0.12, 0.7)})`;
    if (eff === "INEFFECTIVE") return `rgba(178,53,49,${Math.min(0.15 + count * 0.12, 0.7)})`;
    return `rgba(100,120,140,${Math.min(0.1 + count * 0.08, 0.5)})`;
  }

  const effLabels = { EFFECTIVE: "Effective", PARTIALLY_EFFECTIVE: "Partial", INEFFECTIVE: "Ineffective", NOT_TESTED: "Not Tested" };
  const natureLabels = { MANUAL: "Manual", AUTOMATED: "Automated", IT_DEPENDENT_MANUAL: "IT-Dep." };
  const statusColors = { DRAFT: C.warn, PREPARED: C.blue, REVIEWED: "#8a6cc9", APPROVED: "#4A9E6B" };

  return (
    <>
      <Header title="Analytics" meta={`Control environment health · ${controls.length} controls · ${risks.length} risks`} />
      <div style={{ padding: "24px 32px 48px" }}>

        {/* ── Row 1: Action Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>

          {/* Unmitigated Critical/High */}
          <div style={{ background: unmitigated.length > 0 ? "rgba(178,53,49,0.12)" : C.card, border: `1px solid ${unmitigated.length > 0 ? "rgba(178,53,49,0.3)" : C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: unmitigated.length > 0 ? "#fca5a5" : C.steel, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Unmitigated Critical/High</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: unmitigated.length > 0 ? C.crimson : "#4A9E6B", lineHeight: 1 }}>{unmitigated.length}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, marginTop: 8 }}>
              {unmitigated.length === 0 ? "All high risks have coverage" : `${unmitigated.length} risk${unmitigated.length > 1 ? "s" : ""} with no controls mapped`}
            </div>
          </div>

          {/* Risk Coverage Rate */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Risk Coverage Rate</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: coverageRate >= 90 ? "#4A9E6B" : coverageRate >= 70 ? C.warn : C.crimson, lineHeight: 1 }}>{coverageRate}%</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginBottom: 6 }}>{coveredRisks}/{risks.length}</div>
            </div>
            {/* Mini bar */}
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${coverageRate}%`, background: coverageRate >= 90 ? "#4A9E6B" : coverageRate >= 70 ? C.warn : C.crimson, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Key Control Deficit */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Key Controls Not Tested</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: keyNotTested > 0 ? C.warn : "#4A9E6B", lineHeight: 1 }}>{keyNotTested}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, marginTop: 8 }}>
              of {keyControls.length} key controls · {keyEffective} effective
            </div>
          </div>

          {/* Awaiting Review */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Awaiting Review</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: awaitingReview > 0 ? C.copper : "#4A9E6B", lineHeight: 1 }}>{awaitingReview}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, marginTop: 8 }}>
              controls in DRAFT or PREPARED
            </div>
          </div>
        </div>

        {/* ── Row 2: Heatmap + Funnel ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Control Health Heatmap */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Control Health by Risk Rating</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, padding: "0 8px 8px 0", textAlign: "left", fontWeight: 400 }}>Risk</th>
                    {EFF.map(e => (
                      <th key={e} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, padding: "0 4px 8px", textAlign: "center", fontWeight: 400, whiteSpace: "nowrap" }}>
                        {effLabels[e]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATINGS.map(rating => (
                    <tr key={rating}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: { CRITICAL: C.crimson, HIGH: "#fca5a5", MEDIUM: C.warn, LOW: "#4A9E6B" }[rating], padding: "4px 8px 4px 0", whiteSpace: "nowrap" }}>{rating}</td>
                      {EFF.map(eff => {
                        const count = heatmap[rating][eff];
                        return (
                          <td key={eff} style={{ padding: "4px", textAlign: "center" }}>
                            <div style={{ width: 44, height: 36, background: heatColor(rating, eff, count), borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: count > 0 ? 14 : 10, fontWeight: 700, color: count > 0 ? C.cream : "rgba(255,255,255,0.15)", margin: "0 auto" }}>
                              {count > 0 ? count : "·"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              {[["#4A9E6B", "Effective"], ["#C49A3C", "Partial"], ["#B23531", "Ineffective"], ["rgba(100,120,140,0.5)", "Not Tested"]].map(([color, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Status Funnel */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Workflow Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(statusCounts).map(([status, count]) => {
                const pct = controls.length > 0 ? (count / controls.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>{status}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.cream }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: statusColors[status], borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key control effectiveness donut (simple) */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 12, textTransform: "uppercase" }}>Key Control Effectiveness</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["EFFECTIVE", keyEffective, "#4A9E6B"],
                  ["PARTIALLY EFFECTIVE", keyPartial, C.warn],
                  ["INEFFECTIVE", keyIneffective, C.crimson],
                  ["NOT TESTED", keyNotTested, C.steel],
                ].map(([label, count, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, flex: 1 }}>{label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.cream }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Nature×Type Matrix + Process Density ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Nature vs Type */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Control Mix — Nature × Type</div>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, padding: "0 0 10px", textAlign: "left", fontWeight: 400 }} />
                  {NATURES.map(n => (
                    <th key={n} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, padding: "0 8px 10px", textAlign: "center", fontWeight: 400 }}>{natureLabels[n]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map((type, ti) => (
                  <tr key={type}>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, padding: "6px 0", whiteSpace: "nowrap" }}>{type}</td>
                    {NATURES.map(nature => {
                      const count = matrix[type][nature] || 0;
                      return (
                        <td key={nature} style={{ padding: "6px 8px", textAlign: "center" }}>
                          <div style={{
                            width: 44, height: 36, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                            background: count > 0 ? `rgba(196,154,60,${Math.min(0.1 + count * 0.15, 0.65)})` : "rgba(255,255,255,0.03)",
                            fontFamily: "'JetBrains Mono', monospace", fontSize: count > 0 ? 14 : 10,
                            fontWeight: 700, color: count > 0 ? C.cream : "rgba(255,255,255,0.15)", margin: "0 auto",
                          }}>
                            {count > 0 ? count : "·"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, fontStyle: "italic" }}>
              Program maturity: automated preventive controls reduce reliance on manual detection.
            </div>
          </div>

          {/* Process Area Density */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>Control Density by Process Area</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                <div key={area}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.cream }}>{area}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.copper }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxAreaCount) * 100}%`, background: C.copper, opacity: 0.7, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Unmapped Risks Table ── */}
        {uncoveredRisks.length > 0 && (
          <div style={{ background: C.card, border: `1px solid rgba(178,53,49,0.2)`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#fca5a5", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                ⚠ Unmapped Risks — {uncoveredRisks.length} risk{uncoveredRisks.length > 1 ? "s" : ""} with no controls
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Risk ID", "Description", "Rating", "Category"].map(h => (
                    <th key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, padding: "0 12px 8px 0", textAlign: "left", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uncoveredRisks.slice(0, 8).map(riskId => {
                  const risk = risks.find(r => r.riskId === riskId);
                  if (!risk) return null;
                  return (
                    <tr key={riskId}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: C.crimson, padding: "8px 12px 8px 0", borderTop: `1px solid ${C.borderLight}` }}>{risk.riskId}</td>
                      <td style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.cream, padding: "8px 12px 8px 0", borderTop: `1px solid ${C.borderLight}`, maxWidth: 400 }}>{risk.description?.substring(0, 120)}{risk.description?.length > 120 ? "..." : ""}</td>
                      <td style={{ padding: "8px 12px 8px 0", borderTop: `1px solid ${C.borderLight}` }}><Badge bg={{ CRITICAL: "#FCA5A5", HIGH: "#FECACA", MEDIUM: "#FEF3C7", LOW: "#D1FAE5" }[risk.inherentRiskRating]}>{risk.inherentRiskRating}</Badge></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, padding: "8px 0 8px 0", borderTop: `1px solid ${C.borderLight}` }}>{fmtEnum(risk.category)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {uncoveredRisks.length > 8 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginTop: 12 }}>
                + {uncoveredRisks.length - 8} more unmapped risks
              </div>
            )}
          </div>
        )}

        {uncoveredRisks.length === 0 && risks.length > 0 && (
          <div style={{ background: "rgba(74,158,107,0.08)", border: "1px solid rgba(74,158,107,0.2)", borderRadius: 8, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, color: "#4A9E6B" }}>✓</span>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#4A9E6B", fontWeight: 600 }}>Full risk coverage — every risk has at least one mapped control.</div>
          </div>
        )}

      </div>
    </>
  );
}






// ── GlobalSearch Component ────────────────────────────────────────────────────
// Drop this entire block into page.js (before the closing export or after AnalyticsView)
// Then wire into AuditForgeApp (instructions at bottom)

function useGlobalSearch(controls, risks, processes) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return { open, setOpen, query, setQuery };
}

function GlobalSearch({ controls, risks, processes, open, setOpen, query, setQuery, onNavigate }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;

  const q = query.toLowerCase().trim();

  const matchedControls = q.length < 1 ? [] : controls.filter(c =>
    c.controlId?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.process?.processArea?.toLowerCase().includes(q)
  ).slice(0, 5);

  const matchedRisks = q.length < 1 ? [] : risks.filter(r =>
    r.riskId?.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.category?.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedProcesses = q.length < 1 ? [] : processes.filter(p =>
    p.processName?.toLowerCase().includes(q) ||
    p.processArea?.toLowerCase().includes(q) ||
    p.processId?.toLowerCase().includes(q)
  ).slice(0, 3);

  const hasResults = matchedControls.length + matchedRisks.length + matchedProcesses.length > 0;
  const showEmpty  = q.length >= 2 && !hasResults;

  // Quick nav shortcuts (no query needed)
  const SHORTCUTS = [
    { label: "Dashboard",  view: "dashboard",  icon: "◉" },
    { label: "Analytics",  view: "analytics",  icon: "◈" },
    { label: "Controls",   view: "controls",   icon: "⬡" },
    { label: "Risks",      view: "risks",       icon: "△" },
    { label: "Processes",  view: "processes",  icon: "◫" },
    { label: "Generate",   view: "generate",   icon: "⬢" },
    { label: "Import",     view: "import",     icon: "⬒" },
  ];

  function highlight(text, q) {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(196,154,60,0.35)", color: "#F5F1EB", borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)", zIndex: 999,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "18%", left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 600, zIndex: 1000,
        background: "#10202f",
        border: "1px solid rgba(196,154,60,0.25)",
        borderRadius: 12,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(245,241,235,0.08)" }}>
          <span style={{ color: "#4a6080", fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search controls, risks, processes..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, color: "#F5F1EB",
              placeholder: "#4a6080",
            }}
          />
          <kbd style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a6080",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4, padding: "2px 6px",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 440, overflowY: "auto" }}>

          {/* Quick nav (shown when no query) */}
          {q.length === 0 && (
            <div style={{ padding: "12px 0 8px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", letterSpacing: "0.1em", padding: "0 20px 8px", textTransform: "uppercase" }}>Quick Navigation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: "0 8px" }}>
                {SHORTCUTS.map(s => (
                  <div
                    key={s.view}
                    onClick={() => { onNavigate(s.view); setOpen(false); setQuery(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#F5F1EB",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(196,154,60,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 14, color: "#C49A3C", width: 20, textAlign: "center" }}>{s.icon}</span>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          {matchedControls.length > 0 && (
            <div style={{ padding: "12px 0 4px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", letterSpacing: "0.1em", padding: "0 20px 8px", textTransform: "uppercase" }}>Controls</div>
              {matchedControls.map(c => (
                <div
                  key={c.id}
                  onClick={() => { onNavigate("controls"); setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 20px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,241,235,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#C49A3C", minWidth: 110, marginTop: 1 }}>
                    {highlight(c.controlId, q)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: "#F5F1EB", lineHeight: 1.4 }}>
                      {highlight(c.description?.substring(0, 100), q)}{c.description?.length > 100 ? "..." : ""}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a6080", marginTop: 3 }}>
                      {c.process?.processArea} · {c.controlType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risks */}
          {matchedRisks.length > 0 && (
            <div style={{ padding: "12px 0 4px", borderTop: matchedControls.length > 0 ? "1px solid rgba(245,241,235,0.06)" : "none" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", letterSpacing: "0.1em", padding: "0 20px 8px", textTransform: "uppercase" }}>Risks</div>
              {matchedRisks.map(r => (
                <div
                  key={r.id}
                  onClick={() => { onNavigate("risks"); setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 20px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,241,235,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#B23531", minWidth: 110, marginTop: 1 }}>
                    {highlight(r.riskId, q)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: "#F5F1EB", lineHeight: 1.4 }}>
                      {highlight(r.description?.substring(0, 100), q)}{r.description?.length > 100 ? "..." : ""}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a6080", marginTop: 3 }}>
                      {r.inherentRiskRating} · {fmtEnum(r.category)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Processes */}
          {matchedProcesses.length > 0 && (
            <div style={{ padding: "12px 0 4px", borderTop: (matchedControls.length + matchedRisks.length) > 0 ? "1px solid rgba(245,241,235,0.06)" : "none" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", letterSpacing: "0.1em", padding: "0 20px 8px", textTransform: "uppercase" }}>Processes</div>
              {matchedProcesses.map(p => (
                <div
                  key={p.id}
                  onClick={() => { onNavigate("processes"); setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,241,235,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#6B9DC2", minWidth: 110 }}>
                    {highlight(p.processId, q)}
                  </div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: "#F5F1EB" }}>
                    {highlight(p.processName, q)}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a6080", marginLeft: 8 }}>{p.processArea}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#4a6080" }}>No results for "{query}"</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2a3a4a", marginTop: 6 }}>Try a control ID, risk description, or process area</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", borderTop: "1px solid rgba(245,241,235,0.06)",
          background: "rgba(0,0,0,0.2)",
        }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[["↵", "select"], ["↑↓", "navigate"], ["esc", "close"]].map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <kbd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a6080", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px" }}>{key}</kbd>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2a3a4a" }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2a3a4a" }}>AuditForge Search</div>
        </div>
      </div>
    </>
  );
}







// ── GlobalSearch Component ────────────────────────────────────────────────────
// Drop this entire block into page.js (before the closing export or after AnalyticsView)
// Then wire into AuditForgeApp (instructions at bottom)





