'use client';
import TimeAnalyticsDash from "./components/TimeAnalyticsDash";
import TimeEntryGrid from "./components/TimeEntryGrid";
import { LayoutDashboard, BarChart2, Shield, AlertTriangle, Network, BookOpen, FileOutput, Upload, ClipboardCheck, Clock } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

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

// ── Auditors view: constants + helpers ──
const ROLE_BG = { PARTNER: "#FECACA", DIRECTOR: "#FED7AA", MANAGER: "#DBEAFE", SENIOR: "#D1FAE5", STAFF: "#E5E7EB" };
const ROLE_ORDER = { PARTNER: 0, DIRECTOR: 1, MANAGER: 2, SENIOR: 3, STAFF: 4 };
const TEAM_LABELS = {
  AUD:  "Leadership",
  ITGC: "IT General Controls",
  GOV:  "Governance & Oversight",
  FIN:  "Financial Reporting",
  VND:  "Vendor & Third-Party",
  HR:   "HR & Workforce",
  COMM: "Communications & Ethics",
  OPS:  "Operations & Change",
  RI:   "Revenue Integrity",
  DGA:  "Data Gov. & AI",
};
const STR_DIMS = [
  { id: 1, label: "Leadership" },
  { id: 2, label: "Technical" },
  { id: 3, label: "Comms" },
  { id: 4, label: "Judgment" },
  { id: 5, label: "Methodology" },
  { id: 6, label: "Independence" },
  { id: 7, label: "Docs" },
  { id: 8, label: "Breadth" },
];
function teamFromAuditorId(auditorId) {
  if (!auditorId) return "AUD";
  const prefix = auditorId.split("-")[0];
  return TEAM_LABELS[prefix] ? prefix : "AUD";
}
function parseTokens(str) {
  if (!str) return [];
  return str.split(",").map(t => t.trim()).filter(Boolean);
}
function AuditorsIcon({ size = 16 }) {
  return <span style={{ fontSize: size, lineHeight: 1, display: "inline-block", fontFamily: "'JetBrains Mono', monospace", width: size, textAlign: "center" }}>◈</span>;
}

// ── Main App ──

/* ── Mobile Responsive ─────────────────────────────────────── */
const mobileStyles = `
  @media (max-width: 768px) {
    .af-layout { flex-direction: column !important; }
    .af-sidebar {
      width: 100% !important;
      min-width: unset !important;
      flex-direction: row !important;
      padding: 0 !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(245,241,235,0.08) !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 100 !important;
      background: #10202f !important;
    }
    .af-sidebar-brand { display: none !important; }
    .af-sidebar-search { display: none !important; }
    .af-sidebar-nav-label { display: none !important; }
    .af-sidebar-footer { display: none !important; }
    .af-nav-items {
      display: flex !important;
      flex-direction: row !important;
      width: 100% !important;
      padding: 0 !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }
    .af-nav-item {
      flex-direction: column !important;
      gap: 2px !important;
      padding: 8px 6px !important;
      min-width: 56px !important;
      align-items: center !important;
      border-left: none !important;
      border-top: 2px solid transparent !important;
      font-size: 10px !important;
      flex: 1 !important;
    }
    .af-nav-item.active {
      border-left: none !important;
      border-top: 2px solid #C49A3C !important;
    }
    .af-nav-badge { display: none !important; }
    .af-main {
      padding-bottom: 70px !important;
      margin-bottom: 0 !important;
    }
    .af-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    .af-breakdowns-grid {
      grid-template-columns: 1fr !important;
    }
    .af-header {
      padding: 16px 16px 14px !important;
      flex-direction: column !important;
      gap: 8px !important;
      align-items: flex-start !important;
    }
    .af-content-pad {
      padding: 16px 16px 80px !important;
    }
    .af-analytics-cards {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    .af-analytics-mid {
      grid-template-columns: 1fr !important;
    }
    .af-analytics-bot {
      grid-template-columns: 1fr !important;
    }
    .af-table-wrap { overflow-x: auto !important; }
    .af-generate-grid {
      grid-template-columns: 1fr !important;
    }
    .af-mobile-search { display: flex !important; }
    .af-warning-banner {
      font-size: 10px !important;
      padding: 8px 12px !important;
    }
  }
  @keyframes afFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes afScaleIn { from { transform: scale(0.96); } to { transform: scale(1); } }
`;


function MobileStyles() {
  return <style>{mobileStyles}</style>;
}

export default function AuditForgeApp() {
  const [view, setView] = useState("dashboard");
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const { open: searchOpen, setOpen: setSearchOpen, query: searchQuery, setQuery: setSearchQuery } = useGlobalSearch(controls, risks, processes);
  const [audits, setAudits] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ctrlRes, riskRes, procRes, auditRes] = await Promise.all([
          fetch("/api/controls?companyId=CO-DDL"),
          fetch("/api/risks?companyId=CO-DDL"),
          fetch("/api/processes?companyId=CO-DDL"),
          fetch("/api/audits?companyId=CO-DDL").catch(() => ({ json: async () => ({ audits: [] }) })),
          fetch("/api/auditors?companyId=CO-DDL").catch(() => ({ json: async () => ({ auditors: [] }) })),
        ]);
        const [ctrlData, riskData, procData, auditData, auditorData] = await Promise.all([ctrlRes.json(), riskRes.json(), procRes.json(), auditRes.json(), (await fetch("/api/auditors?companyId=CO-DDL")).json()]);
        setControls(ctrlData.controls || []);
        setRisks(riskData.risks || []);
        setProcesses(procData.processes || []);
        setAudits(auditData.audits || []);
        setAuditors(auditorData.auditors || []);
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const refetchControls = async () => {
    try {
      const res = await fetch('/api/controls?companyId=CO-DDL');
      const data = await res.json();
      setControls(data.controls || []);
    } catch (e) { console.error('Refetch failed:', e); }
  };

  const NAV = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "controls", icon: Shield, label: "Controls" },
    { id: "risks", icon: AlertTriangle, label: "Risks" },
    { id: "processes", icon: Network, label: "Processes" },
    { id: "audits", icon: BookOpen, label: "Audits" },
    { id: "auditors", icon: AuditorsIcon, label: "Auditors" },
    { id: "review", icon: ClipboardCheck, label: "Review" },
    { id: "generate", icon: FileOutput, label: "Generate" },
    { id: "import", icon: Upload, label: "Import" },
    { id: "time", icon: Clock, label: "Time" },
  ];

  const draftCount = controls.filter(c => c.reviewStatus === "DRAFT").length;
  const approvedCount = controls.filter(c => c.reviewStatus === "APPROVED").length;

  return (
    <div className="af-layout" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <MobileStyles />
      {/* Sidebar */}
      <nav className="af-sidebar" style={{ width: 240, minWidth: 240, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div className="af-sidebar-brand" style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <a href="/" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream, textDecoration: "none" }}>AuditForge</a>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.05em", marginTop: 4 }}>GOVERNED DOCUMENTATION</div>
        </div>
        <div className="af-nav-items" style={{ padding: "8px 0" }}>
          <div className="af-sidebar-search" onClick={() => setSearchOpen(true)} style={{ margin: "0 12px 8px", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,241,235,0.08)", cursor: "pointer" }}>
            <span style={{ color: "#4a6080", fontSize: 13 }}>⌕</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4a6080", flex: 1 }}>Search...</span>
            <kbd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4a6080", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
          </div>
          <div className="af-sidebar-nav-label" style={{ padding: "16px 12px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.slate, letterSpacing: "0.1em" }}>NAVIGATION</div>
          {NAV.map(n => (
            <div key={n.id} onClick={() => n.id === "import" ? window.location.href = "/import" : setView(n.id)} className={`af-nav-item${view === n.id ? " active" : ""}`}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13,
              fontWeight: view === n.id ? 600 : 400,
              color: view === n.id ? C.cream : C.steel,
              background: view === n.id ? "rgba(196,154,60,0.1)" : "transparent",
              borderLeft: view === n.id ? `2px solid ${C.copper}` : "2px solid transparent",
            }}>
              <n.icon size={16} style={{ minWidth: 16 }} />
              {n.label}
              {n.id === "audits" && audits.length > 0 && <span className="af-nav-badge" style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{audits.length}</span>}
              {n.id === "auditors" && auditors.length > 0 && <span className="af-nav-badge" style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{auditors.length}</span>}
            </div>
          ))}
        </div>
        <div className="af-sidebar-footer">
            <a href="/sign-in" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:6, background:"rgba(178,53,49,0.1)", border:"1px solid rgba(178,53,49,0.2)", textDecoration:"none", marginBottom:12 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#B23531", letterSpacing:"0.06em" }}>Sign In →</span>
            </a>
          </div>
          <div className="af-sidebar-footer" style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.slate, lineHeight: 1.6 }}>
            Dropdown Logistics<br />Chaos → Structured → Automated
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.copper, marginTop: 8 }}>CO-DDL · FY2025 · v0.4</div>
        </div>
      </nav>

      {/* Main */}
      <main className="af-main" style={{ flex: 1, overflow: "auto", background: C.navy }}>
        {/* Mobile search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="af-mobile-search"
          style={{ display: "none", position: "fixed", bottom: 70, right: 16, zIndex: 99,
            width: 44, height: 44, borderRadius: "50%", background: "#C49A3C",
            border: "none", cursor: "pointer", fontSize: 18, color: "#0D1B2A",
            alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          aria-label="Search"
          onTouchEnd={(e) => { e.preventDefault(); setSearchOpen(true); }}
        >⌕</button>
        {/* Grey's Governance Fix: Warning banner when controls are in DRAFT */}
        {!loading && draftCount > 0 && (
          <div className="af-warning-banner" style={{
            padding: "10px 32px", background: C.warnBg, borderBottom: `1px solid ${C.warnBorder}`,
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.warn,
          }}>
            <span style={{ fontSize: 16 }}>⚠ </span>
            <span><strong>{draftCount} of {controls.length}</strong> controls in DRAFT — {approvedCount} approved. Generated documents will be stamped as draft governance state.</span>
          </div>
        )}

        {view === "dashboard" && <DashboardView controls={controls} risks={risks} processes={processes} audits={audits} loading={loading} />}
        {view === "analytics" && <AnalyticsView controls={controls} risks={risks} loading={loading} />}
        {view === "controls" && <ControlsView controls={controls} loading={loading} />}
        {view === "risks" && <RisksView risks={risks} controls={controls} loading={loading} />}
        {view === "processes" && <ProcessesView processes={processes} controls={controls} loading={loading} />}
        {view === "audits" && <AuditsView audits={audits} controls={controls} auditors={auditors} loading={loading} onRefresh={async () => { const r = await fetch("/api/audits?companyId=CO-DDL"); const d = await r.json(); setAudits(d.audits || []); }} />}
        {view === "auditors" && <AuditorsView auditors={auditors} loading={loading} />}
        {view === "review" && <ReviewView controls={controls} loading={loading} onRefresh={refetchControls} />}
        {view === "generate" && <GenerateView controls={controls} />}
        {view === "time" && (
          <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(196,154,60,0.8)", marginBottom: "6px" }}>Time Tracking</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#F5F1EB" }}>Weekly Time Entry</div>
              <div style={{ fontSize: "13px", color: "rgba(245,241,235,0.4)", marginTop: "4px" }}>Log hours by engagement, component, and day.</div>
            </div>
            <TimeEntryGrid audits={audits} currentAuditor={auditors?.[0]} />
          </div>
        )}
        
      </main>
      <GlobalSearch
        controls={controls} risks={risks} processes={processes}
        open={searchOpen} setOpen={setSearchOpen}
        query={searchQuery} setQuery={setSearchQuery}
        onNavigate={setView}
      />
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
        {/* Stats */}
        <div className="af-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
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
        <div className="af-breakdowns-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
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
          <TimeAnalyticsDash />
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
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
              <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: `1px solid ${C.borderLight}`, background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>{c.keyControl ? <span style={{ color: C.green, fontWeight: 700 }}>✔</span> : <span style={{ color: C.slate }}>✗</span>}</td>
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


// -- Review Queue --
const ADVANCE = { DRAFT: "PREPARED", PREPARED: "REVIEWED", REVIEWED: "APPROVED" };
const ADVANCE_LABEL = { DRAFT: "Mark Prepared", PREPARED: "Mark Reviewed", REVIEWED: "Approve" };
const STATUS_ORDER = ["DRAFT", "PREPARED", "REVIEWED", "APPROVED"];

function ReviewView({ controls, loading, onRefresh }) {
  const [advancing, setAdvancing] = useState({});
  const [errors, setErrors] = useState({});

  if (loading) return <div style={{ padding: 32, color: "#6B7B8D" }}>Loading...</div>;

  const grouped = {};
  STATUS_ORDER.forEach(s => { grouped[s] = []; });
  controls.forEach(c => { if (grouped[c.reviewStatus]) grouped[c.reviewStatus].push(c); });

  const total = controls.length;
  const approved = grouped["APPROVED"].length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const advance = async (ctrl) => {
    const toStatus = ADVANCE[ctrl.reviewStatus];
    if (!toStatus) return;
    setAdvancing(prev => ({ ...prev, [ctrl.id]: true }));
    setErrors(prev => ({ ...prev, [ctrl.id]: null }));
    try {
      const res = await fetch("/api/controls/" + ctrl.id + "/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "REVIEW", toStatus, userId: "demo-user" })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [ctrl.id]: data.error || "Transition failed" }));
      } else {
        onRefresh && onRefresh();
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, [ctrl.id]: e.message }));
    } finally {
      setAdvancing(prev => ({ ...prev, [ctrl.id]: false }));
    }
  };

  return (
    <>
      <Header title="Review Queue" meta={approved + " of " + total + " approved"} />
      <div style={{ padding: "24px 32px 48px" }}>
        <div style={{ background: "#10202f", borderRadius: 8, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(245,241,235,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6B7B8D" }}>APPROVAL COVERAGE</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#F5F1EB" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(245,241,235,0.08)", borderRadius: 3 }}>
            <div style={{ height: "100%", width: pct + "%", background: pct >= 90 ? "#4A9E6B" : pct >= 70 ? "#C49A3C" : "#B23531", borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
            {STATUS_ORDER.map(s => (
              <span key={s} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>
                {s}: <span style={{ color: "#F5F1EB", fontWeight: 600 }}>{grouped[s].length}</span>
              </span>
            ))}
          </div>
        </div>

        {STATUS_ORDER.filter(s => s !== "APPROVED").map(status => (
          grouped[status].length === 0 ? null : (
            <div key={status} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#F5F1EB" }}>{status}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>{grouped[status].length} controls</span>
                <div style={{ flex: 1, height: 1, background: "rgba(245,241,235,0.06)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grouped[status].map(ctrl => (
                  <div key={ctrl.id} style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.06)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#F5F1EB", minWidth: 120 }}>{ctrl.controlId}</span>
                    <span style={{ fontFamily: "Source Serif 4, serif", fontSize: 13, color: "#6B7B8D", flex: 1, minWidth: 200 }}>{ctrl.description ? ctrl.description.substring(0, 120) + (ctrl.description.length > 120 ? "..." : "") : ""}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D", minWidth: 80 }}>{ctrl.process?.processArea || ""}</span>
                    {errors[ctrl.id] && <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#B23531" }}>{errors[ctrl.id]}</span>}
                    {ADVANCE[ctrl.reviewStatus] && (
                      <button
                        onClick={() => advance(ctrl)}
                        disabled={advancing[ctrl.id]}
                        style={{ background: advancing[ctrl.id] ? "rgba(196,154,60,0.2)" : "rgba(196,154,60,0.15)", border: "1px solid rgba(196,154,60,0.4)", borderRadius: 6, padding: "6px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 600, color: "#C49A3C", cursor: advancing[ctrl.id] ? "wait" : "pointer", whiteSpace: "nowrap" }}
                      >
                        {advancing[ctrl.id] ? "..." : ADVANCE_LABEL[ctrl.reviewStatus]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {grouped["APPROVED"].length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#4A9E6B" }}>APPROVED</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>{grouped["APPROVED"].length} controls</span>
              <div style={{ flex: 1, height: 1, background: "rgba(245,241,235,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped["APPROVED"].map(ctrl => (
                <div key={ctrl.id} style={{ background: "#10202f", border: "1px solid rgba(74,158,107,0.2)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#4A9E6B", minWidth: 120 }}>{ctrl.controlId}</span>
                  <span style={{ fontFamily: "Source Serif 4, serif", fontSize: 13, color: "#6B7B8D", flex: 1 }}>{ctrl.description ? ctrl.description.substring(0, 120) + (ctrl.description.length > 120 ? "..." : "") : ""}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#4A9E6B" }}>APPROVED</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
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

// ── Create Audit Wizard ──────────────────────────────────────────────────────
function CreateAuditWizard({ controls, auditors, onClose, onCreated }) {
  const STEPS = ["Details", "Controls", "Team", "Review"];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 — Details
  const [auditId, setAuditId] = useState("AUD-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3));
  const [auditName, setAuditName] = useState("");
  const [leadAuditorId, setLeadAuditorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scope, setScope] = useState("");
  const [methodology, setMethodology] = useState("");

  // Step 2 — Controls
  const processAreas = [...new Set(controls.map(c => c.process?.processArea).filter(Boolean))].sort();
  const [selectedControls, setSelectedControls] = useState(new Set());
  const [expandedAreas, setExpandedAreas] = useState(new Set());

  const toggleArea = (area) => {
    const areaControls = controls.filter(c => c.process?.processArea === area);
    const allSelected = areaControls.every(c => selectedControls.has(c.id));
    const next = new Set(selectedControls);
    areaControls.forEach(c => allSelected ? next.delete(c.id) : next.add(c.id));
    setSelectedControls(next);
  };

  const toggleControl = (id) => {
    const next = new Set(selectedControls);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedControls(next);
  };

  // Step 3 — Team
  const [teamMembers, setTeamMembers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberAuditorId, setMemberAuditorId] = useState("");
  const [memberRole, setMemberRole] = useState("STAFF");
  const [memberPhase, setMemberPhase] = useState("ALL");
  const [memberHours, setMemberHours] = useState("");

  const addMember = () => {
    if (!memberAuditorId) return;
    const auditor = auditors.find(a => a.id === memberAuditorId || a.auditorId === memberAuditorId);
    if (!auditor) return;
    setTeamMembers(prev => [...prev.filter(m => m.auditorId !== auditor.auditorId), {
      auditorId: auditor.auditorId,
      auditorName: auditor.auditorName,
      role: auditor.role,
      teamRole: memberRole,
      assignedPhase: memberPhase,
      budgetHours: memberHours ? parseFloat(memberHours) : null,
    }]);
    setMemberAuditorId("");
    setMemberHours("");
    setAddingMember(false);
  };

  const removeMember = (auditorId) => {
    setTeamMembers(prev => prev.filter(m => m.auditorId !== auditorId));
  };

  // Submit
  const handleCreate = async () => {
    if (!auditName || !auditId) { setError("Audit ID and name are required"); return; }
    if (selectedControls.size === 0) { setError("Select at least one control"); return; }
    setSaving(true);
    setError(null);
    try {
      // 1. Create audit
      const auditRes = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "CO-DDL",
          auditId,
          auditName,
          auditType: "INTERNAL",
          leadAuditorId: leadAuditorId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          scope: scope || undefined,
          methodology: methodology || undefined,
        }),
      });
      const auditData = await auditRes.json();
      if (!auditRes.ok) throw new Error(auditData.error || "Failed to create audit");

      // 2. Scope controls
      if (selectedControls.size > 0) {
        await fetch(`/api/audits/${auditData.id}/scope`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            controlIds: [...selectedControls],
            scopeDecision: "IN_SCOPE",
          }),
        });
      }

      // 3. Assign team
      if (teamMembers.length > 0) {
        await fetch(`/api/audits/${auditData.id}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: teamMembers }),
        });
      }

      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return auditName.trim().length > 0 && auditId.trim().length > 0;
    if (step === 1) return selectedControls.size > 0;
    return true;
  };

  const ROLE_COLORS = {
    ENGAGEMENT_LEAD: C.crimson, DIRECTOR: C.crimson, MANAGER: C.copper,
    SENIOR: C.blue, STAFF: "#4A9E6B"
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, width: "100%", maxWidth: 760,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream }}>
              New Audit
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginTop: 2 }}>
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.steel, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", padding: "12px 28px", gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: i < step ? C.green : i === step ? C.copper : "rgba(245,241,235,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                color: i <= step ? C.navy : C.steel,
              }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: i === step ? C.cream : C.steel }}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: C.border, marginLeft: 2 }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* STEP 1 — Details */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>AUDIT ID *</label>
                  <input value={auditId} onChange={e => setAuditId(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>LEAD AUDITOR</label>
                  <select value={leadAuditorId} onChange={e => setLeadAuditorId(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, boxSizing: "border-box" }}>
                    <option value="">Select lead auditor...</option>
                    {auditors.filter(a => ["DIRECTOR", "MANAGER"].includes(a.role)).map(a => (
                      <option key={a.id} value={a.auditorId}>{a.auditorName} ({a.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>AUDIT NAME *</label>
                <input value={auditName} onChange={e => setAuditName(e.target.value)}
                  placeholder="e.g. Technology and Infrastructure Review — FY2025"
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>START DATE</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>END DATE</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>SCOPE DESCRIPTION</label>
                <textarea value={scope} onChange={e => setScope(e.target.value)} rows={3}
                  placeholder="What is being reviewed and why..."
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Source Serif 4', serif", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>METHODOLOGY</label>
                <textarea value={methodology} onChange={e => setMethodology(e.target.value)} rows={3}
                  placeholder="Audit approach and key focus areas..."
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Source Serif 4', serif", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {/* STEP 2 — Controls */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginBottom: 16 }}>
                {selectedControls.size} of {controls.length} controls selected
              </div>
              {processAreas.map(area => {
                const areaControls = controls.filter(c => c.process?.processArea === area);
                const allSelected = areaControls.every(c => selectedControls.has(c.id));
                const someSelected = areaControls.some(c => selectedControls.has(c.id));
                const isExpanded = expandedAreas.has(area);
                return (
                  <div key={area} style={{ marginBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    {/* Area header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      background: allSelected ? "rgba(196,154,60,0.08)" : someSelected ? "rgba(196,154,60,0.04)" : C.navy,
                      cursor: "pointer",
                    }}>
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => toggleArea(area)}
                        style={{ accentColor: C.copper, width: 14, height: 14, cursor: "pointer" }} />
                      <div onClick={() => setExpandedAreas(prev => {
                        const next = new Set(prev);
                        next.has(area) ? next.delete(area) : next.add(area);
                        return next;
                      })} style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.cream }}>{area}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                          {areaControls.filter(c => selectedControls.has(c.id)).length}/{areaControls.length} {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                    {/* Controls list */}
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${C.border}` }}>
                        {areaControls.map(ctrl => (
                          <div key={ctrl.id} onClick={() => toggleControl(ctrl.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "9px 16px 9px 32px",
                            borderBottom: `1px solid rgba(245,241,235,0.04)`,
                            background: selectedControls.has(ctrl.id) ? "rgba(196,154,60,0.04)" : "transparent",
                            cursor: "pointer",
                          }}>
                            <input type="checkbox" checked={selectedControls.has(ctrl.id)}
                              onChange={() => toggleControl(ctrl.id)}
                              style={{ accentColor: C.copper, cursor: "pointer" }} />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.copper, minWidth: 120 }}>{ctrl.controlId}</span>
                            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, flex: 1 }}>{ctrl.description?.substring(0, 80)}...</span>
                            {ctrl.keyControl && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.green }}>KEY</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3 — Team */}
          {step === 2 && (
            <div>
              {/* Team list */}
              {teamMembers.length > 0 && (
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.navy, borderBottom: `2px solid ${C.copper}` }}>
                        {["Auditor", "Engagement Role", "Phase", "Hours", ""].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.cream }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 14px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: C.cream }}>{m.auditorName}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "rgba(196,154,60,0.15)", color: ROLE_COLORS[m.teamRole] || C.steel }}>{m.teamRole}</span>
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>{m.assignedPhase}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cream }}>{m.budgetHours ? m.budgetHours + "h" : "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <button onClick={() => removeMember(m.auditorId)} style={{ background: "none", border: "none", color: C.crimson, cursor: "pointer", fontSize: 12 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: "8px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, borderTop: `1px solid ${C.border}` }}>
                    {teamMembers.length} members · {teamMembers.reduce((s, m) => s + (m.budgetHours || 0), 0)}h total
                  </div>
                </div>
              )}

              {/* Add member form */}
              {addingMember ? (
                <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>AUDITOR</label>
                      <select value={memberAuditorId} onChange={e => setMemberAuditorId(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12 }}>
                        <option value="">Select...</option>
                        {auditors.filter(a => !teamMembers.find(m => m.auditorId === a.auditorId)).map(a => (
                          <option key={a.id} value={a.auditorId}>{a.auditorName} — {a.role}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>ROLE</label>
                      <select value={memberRole} onChange={e => setMemberRole(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12 }}>
                        {["ENGAGEMENT_LEAD","DIRECTOR","MANAGER","SENIOR","STAFF","REVIEWER"].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>PHASE</label>
                      <select value={memberPhase} onChange={e => setMemberPhase(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12 }}>
                        {["ALL","PLANNING","FIELDWORK","REPORTING"].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>HOURS</label>
                      <input type="number" value={memberHours} onChange={e => setMemberHours(e.target.value)} placeholder="0"
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addMember} style={{ padding: "8px 18px", background: C.copper, color: C.navy, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</button>
                    <button onClick={() => setAddingMember(false)} style={{ padding: "8px 18px", background: "transparent", color: C.steel, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingMember(true)} style={{
                  padding: "10px 20px", background: "transparent", color: C.copper,
                  border: `1px dashed ${C.copper}`, borderRadius: 6,
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", width: "100%",
                }}>+ Add Team Member</button>
              )}
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginBottom: 4 }}>AUDIT</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: C.cream }}>{auditName}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.copper, marginTop: 4 }}>{auditId}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "CONTROLS", value: selectedControls.size },
                  { label: "TEAM MEMBERS", value: teamMembers.length },
                  { label: "TOTAL HOURS", value: teamMembers.reduce((s, m) => s + (m.budgetHours || 0), 0) + "h" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: C.copper }}>{s.value}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {scope && (
                <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginBottom: 6 }}>SCOPE</div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream, lineHeight: 1.6 }}>{scope}</div>
                </div>
              )}
              {error && (
                <div style={{ background: "rgba(178,53,49,0.1)", border: "1px solid rgba(178,53,49,0.3)", borderRadius: 8, padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.crimson }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            style={{ padding: "10px 20px", background: "transparent", color: C.steel, border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, cursor: "pointer" }}>
            {step === 0 ? "Cancel" : "← Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
              {step === 1 ? `${selectedControls.size} controls selected` : step === 2 ? `${teamMembers.length} members` : ""}
            </span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
                style={{ padding: "10px 24px", background: canNext() ? C.copper : "rgba(196,154,60,0.3)", color: C.navy, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, cursor: canNext() ? "pointer" : "default" }}>
                Next →
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: "10px 24px", background: saving ? "rgba(178,53,49,0.5)" : C.crimson, color: C.cream, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                {saving ? "Creating..." : "Create Audit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Audit Program Analytics ──────────────────────────────────────────────────
function AuditProgramAnalytics({ audits }) {
  if (!audits || audits.length === 0) return null;

  // Derived stats
  const totalBudgetHours = audits.reduce((s, a) => s + (a.team || []).reduce((t, m) => t + (m.budgetHours || 0), 0), 0);
  const totalControls = audits.reduce((s, a) => s + ((a.controlScope || []).filter(c => c.inScope).length || 0), 0);
  const totalTeamAssignments = audits.reduce((s, a) => s + ((a.team || []).length || 0), 0);
  const statusCounts = audits.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  // By lead
  const byLead = {};
  audits.forEach(a => {
    const lead = a.leadAuditor?.auditorName || 'Unknown';
    if (!byLead[lead]) byLead[lead] = { audits: 0, hours: 0, controls: 0 };
    byLead[lead].audits++;
    byLead[lead].hours += (a.team || []).reduce((t, m) => t + (m.budgetHours || 0), 0);
    byLead[lead].controls += a.controlScope?.filter(c => c.inScope).length || 0;
  });

  // Timeline — months covered
  const now = new Date('2025-01-01');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const STATUS_COLOR = {
    PLANNING: '#C49A3C', FIELDWORK: '#6B9DC2', REPORTING: '#8a6cc9',
    COMPLETED: '#4A9E6B', CANCELLED: '#B23531',
  };

  return (
    <div style={{ padding: "0 32px 32px" }}>

      {/* Stat strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 1, background: "rgba(245,241,235,0.07)",
        borderRadius: 10, overflow: "hidden", marginBottom: 24,
      }}>
        {[
          { value: audits.length, label: "ENGAGEMENTS", sub: Object.entries(statusCounts).map(([k,v]) => v + " " + k.toLowerCase()).join(" · "), color: "#C49A3C" },
          { value: Math.round(totalBudgetHours).toLocaleString() + "h", label: "TOTAL BUDGET", sub: Math.round(totalBudgetHours / audits.length) + "h avg per engagement", color: "#6B9DC2" },
          { value: totalControls, label: "CONTROLS IN SCOPE", sub: Math.round(totalControls / audits.length) + " avg per engagement", color: "#B23531" },
          { value: totalTeamAssignments, label: "TEAM ASSIGNMENTS", sub: Math.round(totalTeamAssignments / audits.length) + " avg team size", color: "#4A9E6B" },
        ].map(s => (
          <div key={s.label} style={{ background: "#10202f", padding: "20px 24px" }}>
            <div style={{ width: 28, height: 2, background: s.color, borderRadius: 1, marginBottom: 10 }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: "#F5F1EB", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#F5F1EB", letterSpacing: "0.08em", margin: "6px 0 3px", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column: Timeline + By Lead */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Timeline */}
        <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>ENGAGEMENT TIMELINE — FY2025</div>
          <div style={{ position: "relative" }}>
            {/* Month labels */}
            <div style={{ display: "flex", marginBottom: 8 }}>
              {months.map(m => (
                <div key={m} style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080", textAlign: "center" }}>{m}</div>
              ))}
            </div>
            {/* Engagement bars */}
            {audits.map((audit, i) => {
              const start = audit.startDate ? new Date(audit.startDate) : null;
              const end = audit.endDate ? new Date(audit.endDate) : null;
              if (!start || !end) return null;
              const startMonth = start.getMonth();
              const endMonth = end.getMonth();
              const spanMonths = endMonth - startMonth + 1;
              const color = STATUS_COLOR[audit.status] || '#C49A3C';
              return (
                <div key={audit.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                  <div style={{ flex: 1, position: "relative", height: 24 }}>
                    <div style={{ position: "absolute", height: "100%", background: "rgba(245,241,235,0.03)", borderRadius: 4, left: 0, right: 0 }} />
                    <div style={{
                      position: "absolute",
                      left: (startMonth / 12 * 100) + "%",
                      width: (spanMonths / 12 * 100) + "%",
                      height: "100%",
                      background: color,
                      borderRadius: 4,
                      opacity: 0.85,
                      display: "flex", alignItems: "center", paddingLeft: 8,
                      overflow: "hidden",
                    }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#0D1B2A", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {audit.auditId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {Object.entries(STATUS_COLOR).map(([status, color]) => (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080" }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By Lead */}
        <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>BY ENGAGEMENT LEAD</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,241,235,0.07)" }}>
                {["Lead", "Audits", "Budget Hours", "Controls"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byLead).sort((a, b) => b[1].hours - a[1].hours).map(([lead, data]) => (
                <tr key={lead} style={{ borderBottom: "1px solid rgba(245,241,235,0.04)" }}>
                  <td style={{ padding: "10px 10px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "#F5F1EB" }}>{lead}</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#C49A3C", fontWeight: 700 }}>{data.audits}</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B9DC2" }}>{Math.round(data.hours)}h</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B23531" }}>{data.controls}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Budget distribution bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D", marginBottom: 8 }}>BUDGET DISTRIBUTION</div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
              {audits.map((a, i) => {
                const hours = a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);
                const pct = (hours / totalBudgetHours * 100).toFixed(1);
                const colors = ["#B23531","#C49A3C","#6B9DC2","#4A9E6B"];
                return (
                  <div key={a.id} title={a.auditId + ": " + hours + "h (" + pct + "%)"} style={{
                    width: pct + "%", background: colors[i % colors.length], borderRadius: 2,
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {audits.map((a, i) => {
                const hours = a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);
                const colors = ["#B23531","#C49A3C","#6B9DC2","#4A9E6B"];
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 1, background: colors[i % colors.length] }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080" }}>{a.auditId.replace("AUD-2025-","")}: {Math.round(hours)}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Process coverage */}
      <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>PROCESS AREA COVERAGE ACROSS ENGAGEMENTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {(() => {
            const areaMap = {};
            audits.forEach(a => {
              (a.controlScope || []).filter(s => s.inScope).forEach(s => {
                const area = s.control?.process?.processArea;
                if (!area) return;
                if (!areaMap[area]) areaMap[area] = { count: 0, audits: new Set() };
                areaMap[area].count++;
                areaMap[area].audits.add(a.auditId);
              });
            });
            return Object.entries(areaMap).sort((a, b) => b[1].count - a[1].count).map(([area, data]) => (
              <div key={area} style={{
                background: "rgba(245,241,235,0.03)", borderRadius: 6, padding: "10px 14px",
                borderLeft: "2px solid " + (data.audits.size > 1 ? "#4A9E6B" : "#C49A3C"),
              }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "#F5F1EB", marginBottom: 3 }}>{area}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D" }}>
                  {data.count} controls · {data.audits.size} engagement{data.audits.size > 1 ? "s" : ""}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

function AuditsView({ audits, controls, auditors, loading, onRefresh }) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;

  if (selectedAudit) {
    // Refresh against current audits prop in case of upstream updates
    const fresh = audits.find((a) => a.id === selectedAudit.id) || selectedAudit;
    return <EngagementOrbital audit={fresh} onBack={() => setSelectedAudit(null)} />;
  }

  return (
    <>
      {showWizard && (
        <CreateAuditWizard
          controls={controls}
          auditors={auditors || []}
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); onRefresh && onRefresh(); }}
        />
      )}
      <Header title="Audit Engagements" meta={`${audits.length} audit(s) · v0.4 Planning Layer`}>
        <button onClick={() => setShowWizard(true)} style={{
            padding: "8px 18px", background: C.crimson, color: C.cream,
            border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>+ New Audit</button>
      </Header>
      <AuditProgramAnalytics audits={audits} />
      <div style={{ padding: "0 32px", marginBottom: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em" }}>ENGAGEMENT DETAIL</div>
      </div>
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
        {audits.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: C.steel, fontFamily: "'Source Serif 4', serif" }}>No audits found. Seed with: node prisma/seed-v04.js</div>
        ) : audits.map(audit => {
          const scopeItems = audit.controlScope || [];
          const inScope = scopeItems.filter(s => s.inScope);
          const keyInScope = inScope.filter(s => s.control?.keyControl);
          const areas = [...new Set(inScope.map(s => s.control?.process?.processArea).filter(Boolean))];

          return (
            <div
              key={audit.id}
              onClick={() => setSelectedAudit(audit)}
              style={{ marginBottom: 32, cursor: "pointer", transition: "filter 150ms ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            >
              {/* Audit Header Card — part of the clickable audit block */}
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


              {/* Team Roster */}
              {audit.team && audit.team.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 12 }}>ENGAGEMENT TEAM</div>
                  <div style={{ background: C.card, border: '1px solid rgba(245,241,235,0.07)', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #C49A3C', background: C.navy }}>
                          {['Auditor', 'Role', 'Phase', 'Budget Hours'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.cream }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {audit.team.sort((a, b) => {
                          const order = { PARTNER: 0, REVIEWER: 1, MANAGER: 2, SENIOR: 3, STAFF: 4 }
                          return (order[a.teamRole] ?? 5) - (order[b.teamRole] ?? 5)
                        }).map((t, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(245,241,235,0.07)' }}>
                            <td style={{ padding: '10px 16px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.cream }}>{t.auditor?.auditorName}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '2px 8px', borderRadius: 3,
                                background: t.teamRole === 'PARTNER' ? 'rgba(178,53,49,0.15)' : t.teamRole === 'MANAGER' ? 'rgba(196,154,60,0.15)' : t.teamRole === 'SENIOR' ? 'rgba(107,157,194,0.15)' : 'rgba(74,158,107,0.15)',
                                color: t.teamRole === 'PARTNER' ? '#B23531' : t.teamRole === 'MANAGER' ? '#C49A3C' : t.teamRole === 'SENIOR' ? '#6B9DC2' : '#4A9E6B'
                              }}>{t.teamRole}</span>
                            </td>
                            <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>{t.assignedPhase}</td>
                            <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cream }}>{t.budgetHours ? t.budgetHours + 'h' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(245,241,235,0.07)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                      {audit.team.length} auditors · {audit.team.reduce((sum, t) => sum + (t.budgetHours || 0), 0)}h total budget
                    </div>
                  </div>
                </div>
              )}
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
                <a
                  href={`/api/generate/download?type=AUDIT_PLAN&companyId=CO-DDL&auditId=${audit.auditId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px",
                    background: C.copper, color: C.navy, borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 13, fontWeight: 600, textDecoration: "none", cursor: "pointer",
                  }}
                >↓ Download Audit Plan</a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Engagement Orbital: full-screen detail view for a single audit ──

function EngagementOrbital({ audit, onBack }) {
  // Audit prop already has team + controlScope populated by the parent /api/audits GET
  const team = audit.team || [];
  const scope = audit.controlScope || [];
  const [downloading, setDownloading] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  // Time entries fetched on demand for the analytics panel
  const [timeData, setTimeData] = useState({ entries: [], summary: null });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/time-entries?auditId=${audit.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/time-entries failed: ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setTimeData(d || { entries: [], summary: null });
      })
      .catch((err) => {
        console.error("EngagementOrbital time-entries fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [audit.id]);

  function formatMonth(d) {
    if (!d) return "—";
    const date = new Date(d);
    const m = date.toLocaleDateString("en-US", { month: "short" });
    const y = date.getFullYear().toString().slice(-2);
    return `${m} '${y}`;
  }

  // Derived values for orbital nodes
  const distinctAreas = new Set(scope.map((s) => s.control?.process?.processArea).filter(Boolean)).size;
  const totalBudget = team.reduce((sum, t) => sum + (t.budgetHours || 0), 0);
  const leadFirstName = audit.leadAuditor?.auditorName?.split(" ")[0] || "—";

  // Derived values for the analytics panel
  const loggedHours = timeData.summary?.totalHours || 0;
  const billableHours = timeData.summary?.billableHours || 0;
  const nonBillableHours = timeData.summary?.nonBillableHours || 0;
  const billablePct = loggedHours > 0 ? (billableHours / loggedHours) * 100 : 0;
  const budgetRemaining = totalBudget - loggedHours;
  const loggedPct = totalBudget > 0 ? Math.min(100, (loggedHours / totalBudget) * 100) : 0;
  const testedCount = scope.filter((s) => s.control?.reviewStatus === "APPROVED" || s.control?.reviewStatus === "REVIEWED").length;
  const testedPct = scope.length > 0 ? (testedCount / scope.length) * 100 : 0;

  // Orbital geometry — per task spec: center (350, 250), orbital radius 180, center r 52, node r 38
  const cx = 350, cy = 250, orbitalR = 180, centerR = 52, nodeR = 38;
  const nodeDefs = [
    { angle: -90, icon: "◈", label: "Lead Auditor",  value: leadFirstName },
    { angle: -30, icon: "⬡", label: "Team",          value: `${team.length} members` },
    { angle: 30,  icon: "▦", label: "Controls",      value: `${scope.length} in scope` },
    { angle: 90,  icon: "⇄", label: "Process Areas", value: `${distinctAreas} areas` },
    { angle: 150, icon: "◐", label: "Budget",        value: `${totalBudget}h` },
    { angle: 210, icon: "△", label: "Timeline",      value: `${formatMonth(audit.startDate)} → ${formatMonth(audit.endDate)}` },
  ];
  const nodes = nodeDefs.map((n) => {
    const a = (n.angle * Math.PI) / 180;
    return {
      ...n,
      x: cx + orbitalR * Math.cos(a),
      y: cy + orbitalR * Math.sin(a),
      lineStart: [cx + centerR * Math.cos(a), cy + centerR * Math.sin(a)],
    };
  });

  // Center node text — abbreviated to fit the 104px diameter at 11px font
  const abbrevName =
    audit.auditName && audit.auditName.length > 20
      ? audit.auditName.slice(0, 14) + "…"
      : audit.auditName || "—";

  // Download logic reused from GenerateView pattern
  function handleDownload(type, extra) {
    setDownloading(type);
    const url = `/api/generate/download?type=${type}&companyId=CO-DDL${extra || ""}`;
    const a = document.createElement("a");
    a.href = url;
    a.click();
    setTimeout(() => setDownloading(null), 2000);
  }

  const firstAreaForWalkthrough = scope[0]?.control?.process?.processArea;

  return (
    <>
      {/* Custom header — back button + title + status badge (not reusing Header for layout control) */}
      <div style={{ padding: "20px 32px 16px", borderBottom: `1px solid ${C.border}` }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: C.copper,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            cursor: "pointer",
            padding: "4px 0 12px",
            letterSpacing: "0.06em",
            display: "block",
          }}
        >
          ← Engagements
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream, lineHeight: 1.2 }}>
              {audit.auditName}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, marginTop: 4, letterSpacing: "0.05em" }}>
              {audit.auditId} · {fmtEnum(audit.auditType) || "—"}
            </div>
          </div>
          <Badge bg={AUDIT_BG[audit.status] || "#E5E7EB"}>{fmtEnum(audit.status) || "—"}</Badge>
        </div>
      </div>

      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
        {/* Orbital SVG */}
        <svg viewBox="0 0 700 500" style={{ width: "100%", maxWidth: 700, display: "block", margin: "0 auto 24px" }}>
          {/* Connecting lines */}
          {nodes.map((n, i) => (
            <line
              key={`line-${i}`}
              x1={n.lineStart[0]}
              y1={n.lineStart[1]}
              x2={n.x}
              y2={n.y}
              stroke={C.border}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Center node */}
          <circle cx={cx} cy={cy} r={centerR} fill={C.card} stroke={C.crimson} strokeWidth="2" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize="11"
            fontWeight="700"
            fill={C.cream}
          >
            {abbrevName}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9"
            fill={C.copper}
            letterSpacing="0.1em"
          >
            {audit.status || "—"}
          </text>

          {/* Surrounding nodes */}
          {nodes.map((n, i) => (
            <g
              key={`node-${i}`}
              onMouseEnter={() => setHoveredNode(i)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "default" }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeR}
                fill={C.card}
                stroke={hoveredNode === i ? C.copper : C.border}
                strokeWidth={hoveredNode === i ? 2 : 1}
                style={{ transition: "stroke 150ms ease, stroke-width 150ms ease" }}
              />
              <text
                x={n.x}
                y={n.y - 8}
                textAnchor="middle"
                fontSize="16"
                fill={C.cream}
                fontFamily="'JetBrains Mono', monospace"
              >
                {n.icon}
              </text>
              <text
                x={n.x}
                y={n.y + 12}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fill={C.cream}
                fontWeight="600"
              >
                {n.value}
              </text>
              <text
                x={n.x}
                y={n.y + nodeR + 16}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8"
                fill={C.steel}
                letterSpacing="0.1em"
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>

        {/* Four panels — 2×2 grid (mobile CSS collapses af-breakdowns-grid to 1 column) */}
        <div
          className="af-breakdowns-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}
        >
          {/* Panel 1 — Team Roster */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: C.copper,
                letterSpacing: "0.12em",
                marginBottom: 14,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Team Roster
            </div>
            {team.length === 0 ? (
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, fontStyle: "italic" }}>
                No team assigned
              </div>
            ) : (
              team.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.borderLight}`,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: 12,
                      color: C.cream,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.auditor?.auditorName || "—"}
                  </div>
                  <Badge bg={ROLE_BG[m.teamRole] || "#E5E7EB"}>{m.teamRole || "—"}</Badge>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: C.steel,
                      minWidth: 42,
                      textAlign: "right",
                    }}
                  >
                    {m.budgetHours ? `${m.budgetHours}h` : "—"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel 2 — Controls in Scope */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "20px 24px",
              maxHeight: 480,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: C.copper,
                letterSpacing: "0.12em",
                marginBottom: 14,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Controls in Scope
            </div>
            {scope.length === 0 ? (
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, fontStyle: "italic" }}>
                No controls in scope
              </div>
            ) : (
              scope.map((s) => (
                <div key={s.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: C.copper,
                        fontWeight: 600,
                      }}
                    >
                      {s.control?.controlId || "—"}
                    </span>
                    <Badge bg={s.inScope ? "#D1FAE5" : "#FECACA"}>
                      {s.scopeDecision ? fmtEnum(s.scopeDecision) : s.inScope ? "In Scope" : "Out"}
                    </Badge>
                  </div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, lineHeight: 1.4 }}>
                    {s.control?.description
                      ? s.control.description.length > 100
                        ? s.control.description.slice(0, 100) + "…"
                        : s.control.description
                      : "—"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel 3 — Engagement Details + Generate */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: C.copper,
                letterSpacing: "0.12em",
                marginBottom: 14,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Engagement Details
            </div>
            <div style={{ marginBottom: 16 }}>
              {[
                { label: "Type",   value: fmtEnum(audit.auditType) || "—" },
                { label: "Status", value: fmtEnum(audit.status) || "—" },
                { label: "Period", value: audit.period?.periodLabel || "—" },
                { label: "Start",  value: formatMonth(audit.startDate) },
                { label: "End",    value: formatMonth(audit.endDate) },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${C.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: C.steel,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {row.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {audit.methodology && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: C.steel,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Methodology
                </div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.cream, lineHeight: 1.5 }}>
                  {audit.methodology.length > 180
                    ? audit.methodology.slice(0, 180) + "…"
                    : audit.methodology}
                </div>
              </div>
            )}
            <div style={{ paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: C.copper,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontWeight: 700,
                }}
              >
                Generate
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "RCM",         type: "RCM",         extra: "" },
                  { label: "MCL",         type: "MCL",         extra: "" },
                  { label: "Walkthrough", type: "WALKTHROUGH", extra: firstAreaForWalkthrough ? `&processArea=${encodeURIComponent(firstAreaForWalkthrough)}` : "" },
                  { label: "Audit Plan",  type: "AUDIT_PLAN",  extra: `&auditId=${audit.auditId}` },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleDownload(btn.type, btn.extra)}
                    disabled={downloading === btn.type}
                    style={{
                      padding: "8px 12px",
                      background: downloading === btn.type ? "rgba(196,154,60,0.2)" : "transparent",
                      color: C.copper,
                      border: `1px solid ${C.copper}`,
                      borderRadius: 6,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: downloading === btn.type ? "wait" : "pointer",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {downloading === btn.type ? "…" : `↓ ${btn.label}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 4 — Engagement Analytics */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: C.copper,
                letterSpacing: "0.12em",
                marginBottom: 14,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Engagement Analytics
            </div>

            {/* Section 1 — Hours */}
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Hours
              </div>
              {[
                { label: "Budget",    value: `${totalBudget}h`,                color: C.cream },
                { label: "Logged",    value: `${loggedHours.toFixed(1)}h`,     color: C.crimson },
                { label: "Remaining", value: `${budgetRemaining.toFixed(1)}h`, color: C.steel },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>{row.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: 6, background: "rgba(245,241,235,0.08)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${loggedPct}%`, background: C.crimson, borderRadius: 3, transition: "width 300ms ease" }} />
              </div>
            </div>

            {/* Section 2 — Billable % */}
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Billable %
              </div>
              {[
                { label: "Billable",     value: `${billableHours.toFixed(1)}h`,    color: C.green },
                { label: "Non-Billable", value: `${nonBillableHours.toFixed(1)}h`, color: C.copper },
                { label: "Billable %",   value: `${billablePct.toFixed(1)}%`,      color: billablePct >= 75 ? C.green : C.crimson },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>{row.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Section 3 — Control Coverage */}
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Control Coverage
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>Tested</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cream, fontWeight: 600 }}>
                  {testedCount} of {scope.length}
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(245,241,235,0.08)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${testedPct}%`, background: C.green, borderRadius: 3, transition: "width 300ms ease" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Auditors: firm roster view with basketball card modal ──

function StrengthDots({ tokens }) {
  const set = new Set(parseTokens(tokens));
  return (
    <div style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const filled = set.has(`STR-0${i}`);
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: filled ? C.copper : "rgba(245,241,235,0.12)",
            }}
          />
        );
      })}
    </div>
  );
}

function StrengthRadar({ strengthTokens, weaknessTokens }) {
  const strSet = new Set(parseTokens(strengthTokens));
  const wksSet = new Set(parseTokens(weaknessTokens));

  const cx = 200, cy = 200, maxR = 130;
  // STR wins: a dimension flagged as both strength and gap scores as a strength
  const scoreFor = (dimId) => {
    if (strSet.has(`STR-0${dimId}`)) return 8;
    if (wksSet.has(`WKS-0${dimId}`)) return 2;
    return 5;
  };
  const angle = (i) => -Math.PI / 2 + i * (Math.PI / 4);
  const xy = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

  const rings = [2, 4, 6, 8].map((score) => {
    const r = (score / 8) * maxR;
    return STR_DIMS.map((_, i) => xy(r, angle(i)).join(",")).join(" ");
  });

  const axisEnds = STR_DIMS.map((_, i) => xy(maxR, angle(i)));

  const dataPoints = STR_DIMS.map((dim, i) => {
    const score = scoreFor(dim.id);
    return {
      score,
      point: xy((score / 8) * maxR, angle(i)),
      labelXY: xy(maxR + 22, angle(i)),
    };
  });

  const polygonPoints = dataPoints.map((p) => p.point.join(",")).join(" ");

  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }}>
      {rings.map((pts, i) => (
        <polygon key={`ring-${i}`} points={pts} fill="none" stroke="rgba(245,241,235,0.08)" strokeWidth="1" />
      ))}
      {axisEnds.map(([x, y], i) => (
        <line key={`axis-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(245,241,235,0.08)" strokeWidth="1" />
      ))}
      <polygon points={polygonPoints} fill="rgba(178,53,49,0.22)" stroke={C.crimson} strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={`pt-${i}`} cx={p.point[0]} cy={p.point[1]} r="3.5" fill={C.crimson} />
      ))}
      {dataPoints.map((p, i) => {
        const [lx, ly] = p.labelXY;
        const anchor = lx < cx - 5 ? "end" : lx > cx + 5 ? "start" : "middle";
        return (
          <text
            key={`lbl-${i}`}
            x={lx}
            y={ly + 3}
            fontSize="10"
            fill={C.cream}
            textAnchor={anchor}
            fontFamily="'JetBrains Mono', monospace"
          >
            {STR_DIMS[i].label}
          </text>
        );
      })}
    </svg>
  );
}

function AuditorCardModal({ auditor, onClose }) {
  const strTokens = parseTokens(auditor.strengthTokens);
  const wksTokens = parseTokens(auditor.weaknessTokens);
  // STR wins: filter gaps whose STR counterpart is already flagged as a strength
  const strDimIds = new Set(strTokens.map((t) => parseInt(t.replace("STR-", ""), 10)));
  const activeGaps = wksTokens.filter((t) => !strDimIds.has(parseInt(t.replace("WKS-", ""), 10)));
  const teamKey = teamFromAuditorId(auditor.auditorId);
  const teamLabel = TEAM_LABELS[teamKey] || teamKey;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,27,42,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        padding: 20,
        animation: "afFadeIn 180ms ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderLeft: `4px solid ${C.crimson}`,
          borderRadius: 8,
          padding: "32px 40px",
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          animation: "afScaleIn 180ms ease-out",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            background: "none",
            border: "none",
            color: C.steel,
            fontSize: 18,
            cursor: "pointer",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            {auditor.auditorId}
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.cream, marginBottom: 4 }}>
            {auditor.auditorName}
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.steel, marginBottom: 10 }}>
            {auditor.title || "—"}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
              {auditor.firm || "—"}
            </span>
            {auditor.certifications && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "3px 10px", borderRadius: 4, background: "rgba(196,154,60,0.15)", color: C.copper, fontWeight: 600, letterSpacing: "0.04em" }}>
                {auditor.certifications}
              </span>
            )}
          </div>
        </div>

        {/* Radar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Competency Profile · How am I getting better?
          </div>
          <StrengthRadar strengthTokens={auditor.strengthTokens} weaknessTokens={auditor.weaknessTokens} />
        </div>

        {/* Strengths + Gaps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.green, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
              Strengths
            </div>
            {strTokens.length > 0 ? (
              strTokens.map((t) => {
                const dimId = parseInt(t.replace("STR-", ""), 10);
                const dim = STR_DIMS.find((d) => d.id === dimId);
                return (
                  <div key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, padding: "4px 0" }}>
                    <span style={{ color: C.green, marginRight: 8 }}>●</span>
                    {dim?.label || t}
                  </div>
                );
              })
            ) : (
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, fontStyle: "italic" }}>
                No strengths flagged
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.crimson, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
              Gaps
            </div>
            {activeGaps.length > 0 ? (
              activeGaps.map((t) => {
                const dimId = parseInt(t.replace("WKS-", ""), 10);
                const dim = STR_DIMS.find((d) => d.id === dimId);
                return (
                  <div key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, padding: "4px 0" }}>
                    <span style={{ color: C.crimson, marginRight: 8 }}>○</span>
                    {dim?.label || t}
                  </div>
                );
              })
            ) : (
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, fontStyle: "italic" }}>
                No gaps flagged
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <Badge bg={ROLE_BG[auditor.role] || "#E5E7EB"}>{auditor.role || "—"}</Badge>
          <Badge bg="#DBEAFE">{auditor.independence || "—"}</Badge>
          <Badge bg="#FEF3C7">{teamLabel}</Badge>
        </div>
      </div>
    </div>
  );
}

function AuditorsView({ auditors, loading }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null); // { auditor, top }
  const hoveredTop2 = hovered
    ? parseTokens(hovered.auditor.strengthTokens).slice(0, 2).map((t) => {
        const dimId = parseInt(t.replace("STR-", ""), 10);
        return STR_DIMS.find((d) => d.id === dimId)?.label || t;
      })
    : [];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.steel }}>
        Loading auditors...
      </div>
    );
  }

  // Deduplicate by auditorName, keeping the most senior role (lowest ROLE_ORDER)
  const dedupMap = new Map();
  for (const a of auditors) {
    const prev = dedupMap.get(a.auditorName);
    if (!prev || (ROLE_ORDER[a.role] ?? 99) < (ROLE_ORDER[prev.role] ?? 99)) dedupMap.set(a.auditorName, a);
  }
  const roster = [...dedupMap.values()];

  // Group by team prefix in auditorId
  const byTeam = {};
  for (const a of roster) {
    const key = teamFromAuditorId(a.auditorId);
    if (!byTeam[key]) byTeam[key] = [];
    byTeam[key].push(a);
  }
  // Sort teams alphabetically by friendly label
  const teamKeys = Object.keys(byTeam).sort((a, b) =>
    (TEAM_LABELS[a] || a).localeCompare(TEAM_LABELS[b] || b)
  );
  // Sort within each team: role order, then auditorName
  for (const key of teamKeys) {
    byTeam[key].sort((a, b) => {
      const ra = ROLE_ORDER[a.role] ?? 99;
      const rb = ROLE_ORDER[b.role] ?? 99;
      if (ra !== rb) return ra - rb;
      return (a.auditorName || "").localeCompare(b.auditorName || "");
    });
  }

  const thStyle = {
    padding: "12px 16px",
    textAlign: "left",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    color: C.steel,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 600,
    borderBottom: `1px solid ${C.border}`,
  };
  const tdBase = {
    padding: "12px 16px",
    fontFamily: "'Source Serif 4', serif",
    fontSize: 12,
    color: C.cream,
    borderBottom: `1px solid ${C.borderLight}`,
  };

  return (
    <>
      <Header title="Auditors" meta={`Firm roster · ${roster.length} auditors · ${teamKeys.length} teams`} />
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Certs</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Indep</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {teamKeys.flatMap((key) => [
                <tr key={`hdr-${key}`} style={{ background: "rgba(196,154,60,0.08)", borderTop: `1px solid ${C.border}` }}>
                  <td colSpan={6} style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                    {TEAM_LABELS[key] || key}
                    <span style={{ color: C.steel, marginLeft: 10, fontWeight: 400 }}>· {byTeam[key].length}</span>
                  </td>
                </tr>,
                ...byTeam[key].map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    style={{ cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(245,241,235,0.03)";
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHovered({ auditor: a, top: rect.top + rect.height / 2 });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      setHovered(null);
                    }}
                  >
                    <td style={tdBase}>{a.auditorName || "—"}</td>
                    <td style={{ ...tdBase, color: C.steel, fontSize: 11 }}>{a.title || "—"}</td>
                    <td style={{ ...tdBase, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{a.certifications || "—"}</td>
                    <td style={tdBase}><Badge bg={ROLE_BG[a.role] || "#E5E7EB"}>{a.role || "—"}</Badge></td>
                    <td style={{ ...tdBase, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>{a.independence || "—"}</td>
                    <td style={{ ...tdBase, textAlign: "center" }}><StrengthDots tokens={a.strengthTokens} /></td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </div>
      {selected && <AuditorCardModal auditor={selected} onClose={() => setSelected(null)} />}
      {hovered && (
        <div
          style={{
            position: "fixed",
            top: hovered.top,
            right: 48,
            transform: "translateY(-50%)",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.crimson}`,
            borderRadius: 6,
            padding: "12px 16px",
            minWidth: 240,
            maxWidth: 280,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: C.cream,
            zIndex: 500,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "afFadeIn 140ms ease-out",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <Badge bg={ROLE_BG[hovered.auditor.role] || "#E5E7EB"}>{hovered.auditor.role || "—"}</Badge>
          </div>
          <div style={{ fontSize: 9, color: C.green, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Top Strengths
          </div>
          <div style={{ marginBottom: 10 }}>
            {hoveredTop2.length > 0 ? (
              hoveredTop2.map((label, i) => (
                <div key={i} style={{ padding: "2px 0", fontSize: 10 }}>
                  <span style={{ color: C.green, marginRight: 6 }}>●</span>
                  {label}
                </div>
              ))
            ) : (
              <div style={{ color: C.steel, fontStyle: "italic", fontSize: 10 }}>None flagged</div>
            )}
          </div>
          {hovered.auditor.certifications && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: C.copper, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>
                Certifications
              </div>
              <div style={{ color: C.copper, fontSize: 10 }}>{hovered.auditor.certifications}</div>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4, color: C.steel, fontSize: 9, letterSpacing: "0.06em" }}>
            Click for full profile →
          </div>
        </div>
      )}
    </>
  );
}

// ── Generate (with download buttons + Grey's governance stamp) ──
function GenerateView({ controls }) {
  const [downloading, setDownloading] = useState(null);
  const draftCount = controls.filter(c => c.reviewStatus === "DRAFT").length;
  const processAreas = [...new Set(controls.map(c => c.process?.processArea).filter(Boolean))];

  const DOC_TYPES = [
    { id: "RCM", label: "Risk Control Matrix", ext: "XLSX", desc: "Full RCM with cover, matrix, and summary. Maps controls to risks, frameworks, and assertions.", icon: "▦" },
    { id: "MCL", label: "Master Control List", ext: "XLSX", desc: "Complete control catalog with status breakdown by review state, type, and nature.", icon: "▤" },
    { id: "AUDIT_PLAN", label: "Audit Plan", ext: "XLSX", desc: "Cover, scope matrix, timeline. Controls in scope with assignments and target dates.", icon: "▥" },
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>

        {/* Grey's Fix: Governance state warning on generate page */}
        {draftCount > 0 && (
          <div style={{
            background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 8,
            padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 20, color: C.warn }}>⚠ </span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.warn }}>Governance State: {draftCount} of {controls.length} controls in DRAFT</div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, marginTop: 4 }}>Generated documents will include a "Document Status: DRAFT" stamp. Approve all source controls to generate production-grade output.</div>
            </div>
          </div>
        )}

        {/* Document cards */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 16 }}>DOCUMENT TYPE</div>
        <div className="af-generate-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
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
        <div className="af-generate-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
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
// Add to NAV array: { id: "analytics", icon: "◫", label: "Analytics" }
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
      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>

        {/* ── Row 1: Action Cards ── */}
        <div className="af-analytics-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>

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
        <div className="af-analytics-mid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

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
        <div className="af-analytics-mid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

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
                ⚠  Unmapped Risks — {uncoveredRisks.length} risk{uncoveredRisks.length > 1 ? "s" : ""} with no controls
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
    { label: "Dashboard",  view: "dashboard",  icon: "▦" },
    { label: "Analytics",  view: "analytics",  icon: "◫" },
    { label: "Controls",   view: "controls",   icon: "↑" },
    { label: "Risks",      view: "risks",       icon: "△" },
    { label: "Processes",  view: "processes",  icon: "⇄" },
    { label: "Generate",   view: "generate",   icon: "↓" },
    { label: "Import",     view: "import",     icon: "↥" },
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





