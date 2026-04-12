"use client";
// WorkBench — Promotional Landing Page (upgraded with orbital + animations)
// Standalone public marketing page. No app shell, no auth.
// WorkBench Light design system — light mode only.

import { useState, useEffect, useRef } from "react";

// ── WorkBench Light palette ──
const W = {
  fog:     "#DBEAFE",
  white:   "#FFFFFF",
  cloud:   "#CBD5E1",
  slate:   "#1E293B",
  iron:    "#334155",
  steel:   "#64748B",
  mist:    "#BFDBFE",
  sky:     "#3B82F6",
  green:   "#4A9E6B",
  amber:   "#C49A3C",
  skyBg:   "#EFF6FF",
  greenBg: "#F0FDF4",
  amberBg: "#FFFBEB",
};

// ── All 17 modules ──
const MODULES = [
  { name: "Controls",          icon: "\u25A6", status: "LIVE",        desc: "106 controls across 9 process areas, mapped to risks, frameworks, and assertions with full workflow.",                     data: "106 controls \u00b7 9 process areas" },
  { name: "Teams",             icon: "\u25C8", status: "LIVE",        desc: "47 auditors with verified skill tokens, basketball card profiles, and radar chart visualization.",                         data: "47 auditors \u00b7 10 teams" },
  { name: "Time Tracking",     icon: "\u25D0", status: "LIVE",        desc: "Weekly time entry by engagement and component with billable/non-billable tracking and monthly trends.",                   data: "1,099 entries \u00b7 4 engagements" },
  { name: "Analytics",         icon: "\u21C4", status: "LIVE",        desc: "Live dashboards showing budget vs actual hours, billable percentage, and control coverage by engagement.",                data: "Live utilization \u00b7 Billable %" },
  { name: "HR & People",       icon: "\u25EB", status: "COMING SOON", desc: "Employee records, org chart, role management, and onboarding checklists \u2014 connected to your time data.",              data: null },
  { name: "Payroll",           icon: "\u25CE", status: "COMING SOON", desc: "Pay runs built from your logged hours. No double entry. The time data is already there.",                                data: null },
  { name: "Capacity Planning", icon: "\u2B21", status: "COMING SOON", desc: "Who can do what, when \u2014 skill matching, utilization projection, and revenue impact in one view.",                    data: null },
  { name: "Invoicing",         icon: "\u25B3", status: "COMING SOON", desc: "Turn logged hours into invoices. One click from time entry to client-ready document.",                                   data: null },
  { name: "Accounting",        icon: "\u229E", status: "COMING SOON", desc: "Chart of accounts, P&L, balance sheet. The books live where the work lives.",                                           data: null },
  { name: "Expenses",          icon: "\u25C1", status: "COMING SOON", desc: "Log it, categorize it, reconcile it. Receipts in, reports out.",                                                        data: null },
  { name: "Documents",         icon: "\u25A3", status: "COMING SOON", desc: "Contracts, SOPs, policies. Version controlled. One place.",                                                              data: null },
  { name: "Scheduling",        icon: "\u25F7", status: "COMING SOON", desc: "Who\u2019s working when. Connected to capacity and time.",                                                              data: null },
  { name: "CRM",               icon: "\u25C9", status: "COMING SOON", desc: "Client records, contacts, engagement history. The relationship layer.",                                                  data: null },
  { name: "Reporting",         icon: "\u25A4", status: "COMING SOON", desc: "Pull any metric across any module. One dashboard, your numbers.",                                                        data: null },
  { name: "Integrations",      icon: "\u27F3", status: "COMING SOON", desc: "QuickBooks, Stripe, Gusto. WorkBench connects to what you already have.",                                               data: null },
  { name: "Ledger Cards",      icon: "\u25C7", status: "COMING SOON", desc: "Verified work history that travels with your team. Portable, cryptographically signed, and yours.",                      data: null },
  { name: "Client Portal",     icon: "\u25B7", status: "COMING SOON", desc: "A read-only window into your work for clients and stakeholders \u2014 real-time status without the PDF.",                data: null },
];

// ── Connection map for the orbital ──
const CONNECTIONS = [
  ["Time Tracking", "Payroll"],       ["Time Tracking", "Invoicing"],
  ["Time Tracking", "Capacity Planning"], ["Time Tracking", "Analytics"],
  ["Controls", "Analytics"],          ["Teams", "Capacity Planning"],
  ["Teams", "Scheduling"],            ["Teams", "HR & People"],
  ["HR & People", "Payroll"],         ["HR & People", "Ledger Cards"],
  ["Expenses", "Accounting"],         ["Expenses", "Reporting"],
  ["CRM", "Invoicing"],               ["CRM", "Client Portal"],
  ["Analytics", "Reporting"],         ["Controls", "Reporting"],
  ["Teams", "Reporting"],             ["Time Tracking", "Reporting"],
];

// ── Orbital geometry helpers ──
const OC = { cx: 350, cy: 350, innerR: 140, outerR: 270, innerNodeR: 36, outerNodeR: 28, hubR: 40 };

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

const INNER_MODULES = ["Controls", "Teams", "Time Tracking", "Analytics"];
const INNER_ANGLES = [-90, 0, 90, 180];
const OUTER_MODULES = MODULES.filter((m) => m.status === "COMING SOON");

// Short labels for outer ring (fit inside r=28 circles)
const SHORT_LABELS = { "HR & People": "HR", "Capacity Planning": "CAPACITY", "Ledger Cards": "LEDGER", "Client Portal": "CLIENT", "Integrations": "INTEGR." };

// ── Injected styles ──
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @keyframes wbPulse { 0%, 100% { opacity: 0.92; } 50% { opacity: 1; } }

  @media (prefers-reduced-motion: reduce) {
    .wb-pulse-tile { animation: none !important; }
  }

  @media (max-width: 768px) {
    .wb-nav { padding: 16px !important; flex-wrap: wrap; gap: 12px !important; }
    .wb-hero { padding: 40px 16px !important; }
    .wb-headline { font-size: 40px !important; }
    .wb-subhead { font-size: 14px !important; }
    .wb-chip-row { flex-wrap: wrap !important; justify-content: center !important; }
    .wb-svg-wrap { padding: 0 12px 48px !important; }
    .wb-orbital-section { padding: 48px 16px !important; }
    .wb-modules { padding: 48px 16px !important; }
    .wb-module-grid { grid-template-columns: 1fr !important; }
    .wb-pitch { grid-template-columns: 1fr !important; padding: 0 16px 56px !important; }
    .wb-attribution { flex-direction: column !important; gap: 16px !important; text-align: center !important; padding: 24px 16px !important; }
    .wb-attr-right { text-align: center !important; }
    .wb-footer { padding: 32px 16px !important; }
    .wb-modules-header h2 { font-size: 24px !important; }
  }
`;

// ── WorkBench mark SVG ──
function WBMark({ size = 36 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 36 40" style={{ display: "block" }}>
      <rect x="0"  y="0"  width="10" height="10" rx="3" fill={W.sky} />
      <rect x="13" y="0"  width="10" height="10" rx="3" fill={W.sky} />
      <rect x="26" y="0"  width="10" height="10" rx="3" fill={W.sky} />
      <rect x="0"  y="13" width="10" height="10" rx="3" fill={W.sky} />
      <rect x="13" y="13" width="10" height="10" rx="3" fill="none" stroke={W.sky} strokeWidth="1.5" strokeDasharray="2 2" />
      <rect x="26" y="13" width="10" height="10" rx="3" fill="none" stroke={W.sky} strokeWidth="1.5" strokeDasharray="2 2" />
      <rect x="0" y="28" width="36" height="4" rx="2" fill={W.mist} />
      <rect x="0" y="28" width="9" height="4" rx="2" fill={W.sky} />
    </svg>
  );
}

// ── Orbital diagram — isolated component with its own rAF rotation loop ──
function OrbitalDiagram() {
  const [innerAngle, setInnerAngle] = useState(0);
  const [outerAngle, setOuterAngle] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // respect reduced-motion: render at base positions

    function tick(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setInnerAngle((elapsed / 60000) * 360);
      setOuterAngle(-(elapsed / 90000) * 360);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Compute live node positions from current rotation angles
  const liveInner = INNER_MODULES.map((name, i) => {
    const m = MODULES.find((mod) => mod.name === name);
    const [x, y] = polar(OC.cx, OC.cy, OC.innerR, INNER_ANGLES[i] + innerAngle);
    return { ...m, x, y };
  });
  const liveOuter = OUTER_MODULES.map((m, i) => {
    const [x, y] = polar(OC.cx, OC.cy, OC.outerR, -90 + i * (360 / 13) + outerAngle);
    return { ...m, x, y };
  });
  const liveNodeMap = {};
  [...liveInner, ...liveOuter].forEach((n) => { liveNodeMap[n.name] = n; });

  function getConnectionsFor(name) {
    return CONNECTIONS.filter(([a, b]) => a === name || b === name).map(([a, b]) => (a === name ? b : a));
  }

  return (
    <>
      <svg viewBox="0 0 700 700" style={{ width: "100%", maxWidth: 800, display: "block", margin: "0 auto" }} onMouseMove={(e) => setTooltipPos({ x: e.clientX + 16, y: e.clientY + 16 })} onMouseLeave={() => setHoveredNode(null)}>
        {/* Connection lines — use live positions so they track rotating nodes */}
        {CONNECTIONS.map(([a, b], i) => {
          const na = liveNodeMap[a], nb = liveNodeMap[b];
          if (!na || !nb) return null;
          const isHighlighted = hoveredNode && (a === hoveredNode || b === hoveredNode);
          return <line key={`conn-${i}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={isHighlighted ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.08)"} strokeWidth={isHighlighted ? 1.5 : 1} />;
        })}

        {/* Center hub */}
        <circle cx={OC.cx} cy={OC.cy} r={OC.hubR} fill={W.skyBg} stroke={W.sky} strokeWidth="2" />
        <text x={OC.cx} y={OC.cy - 4} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill={W.sky}>DATA</text>
        <text x={OC.cx} y={OC.cy + 10} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="11" fontWeight="700" fill={W.sky}>LAYER</text>

        {/* Inner ring nodes — positioned directly, no CSS rotation wrapper */}
        {liveInner.map((n) => {
          const isHovered = hoveredNode === n.name;
          return (
            <g key={n.name} onMouseEnter={() => setHoveredNode(n.name)} style={{ cursor: "pointer" }}>
              <circle cx={n.x} cy={n.y} r={OC.innerNodeR} fill={W.skyBg} stroke={isHovered ? "#1D4ED8" : W.sky} strokeWidth={isHovered ? 3 : 2} />
              <text x={n.x} y={n.y - 4} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="16" fill={W.sky}>{n.icon}</text>
              <text x={n.x} y={n.y + 18} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill={W.slate} letterSpacing="0.08em" fontWeight="600">{n.name.toUpperCase()}</text>
              <circle cx={n.x} cy={n.y + 32} r="4" fill={W.green} />
            </g>
          );
        })}

        {/* Outer ring nodes — positioned directly */}
        {liveOuter.map((n) => {
          const isHovered = hoveredNode === n.name;
          const shortLabel = SHORT_LABELS[n.name] || n.name.toUpperCase();
          return (
            <g key={n.name} onMouseEnter={() => setHoveredNode(n.name)} style={{ cursor: "pointer" }}>
              <circle cx={n.x} cy={n.y} r={OC.outerNodeR} fill={isHovered ? "#FEF3C7" : W.amberBg} stroke={isHovered ? "#92400E" : W.amber} strokeWidth={isHovered ? 2 : 1} strokeDasharray="4 3" />
              <text x={n.x} y={n.y - 3} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="13" fill={W.amber}>{n.icon}</text>

            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredNode && liveNodeMap[hoveredNode] && (
        <div style={{ position: "fixed", left: Math.min(tooltipPos.x, typeof window !== "undefined" ? window.innerWidth - 260 : 600), top: Math.min(tooltipPos.y, typeof window !== "undefined" ? window.innerHeight - 160 : 500), background: W.white, border: `1px solid ${W.mist}`, borderRadius: 8, padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", pointerEvents: "none", zIndex: 100, minWidth: 200, maxWidth: 260, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: W.slate }}>{hoveredNode}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: liveNodeMap[hoveredNode].status === "LIVE" ? W.green : W.amber, padding: "2px 8px", borderRadius: 10, background: liveNodeMap[hoveredNode].status === "LIVE" ? W.greenBg : W.amberBg, border: `1px solid ${liveNodeMap[hoveredNode].status === "LIVE" ? "rgba(74,158,107,0.25)" : "rgba(196,154,60,0.25)"}` }}>{liveNodeMap[hoveredNode].status}</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: W.steel, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Connects to:</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: W.iron, lineHeight: 1.4 }}>{getConnectionsFor(hoveredNode).join(", ") || "\u2014"}</div>
        </div>
      )}
    </>
  );
}

export default function WorkBenchPage() {
  // ── State ──
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.round(500 * (4 / 17))), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Hero grid cells ──
  const heroModules = MODULES.slice(0, 6);
  const cellW = 160, cellH = 80, gap = 10, gridX = 30;
  const heroCells = heroModules.map((m, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    return { ...m, x: gridX + col * (cellW + gap), y: row * (cellH + gap), isLive: m.status === "LIVE" };
  });

  return (
    <div style={{ minHeight: "100vh", background: W.fog, color: W.slate, fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* ── SECTION 1 — NAV BAR ── */}
      <nav className="wb-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", maxWidth: 1200, margin: "0 auto", background: "#C7D9F8", borderBottom: "1px solid #BFDBFE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <WBMark size={36} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: W.slate }}>Work</span><span style={{ color: W.sky }}>Bench</span>
          </span>
        </div>
        <a href="/app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: W.sky, textDecoration: "none", background: W.skyBg, border: "1px solid #BFDBFE", borderRadius: 20, padding: "5px 12px" }}>
          Built on AuditForge →
        </a>
      </nav>

      {/* ── SECTION 2 — HERO ── */}
      <section className="wb-hero" style={{ textAlign: "center", padding: "56px 32px 40px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: W.sky, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20, fontWeight: 500 }}>
          MODULAR BUSINESS OS · FROM DROPDOWN LOGISTICS
        </div>
        <h1 className="wb-headline" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 64, fontWeight: 700, color: W.slate, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 24px" }}>
          Build the stack{"\n"}your business{"\n"}actually needs.
        </h1>
        <p className="wb-subhead" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: W.steel, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 16px" }}>
          Pick what fits. Leave what doesn&apos;t. WorkBench modules run on the same data layer — so everything you choose connects from day one.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>
          For professional services firms of 2–20 people building their operational stack.
        </p>
        <div className="wb-chip-row" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {[
            { label: "MODULAR",         bg: W.skyBg,   color: W.sky,   border: "rgba(59,130,246,0.25)" },
            { label: "PICK AND CHOOSE", bg: W.greenBg, color: W.green, border: "rgba(74,158,107,0.25)" },
            { label: "SAME DATA LAYER", bg: W.amberBg, color: W.amber, border: "rgba(196,154,60,0.25)" },
          ].map((c) => (
            <span key={c.label} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", padding: "5px 14px", borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── SECTION 3 — MODULE GRID HERO SVG ── */}
      <div className="wb-svg-wrap" style={{ padding: "0 32px 64px", maxWidth: 700, margin: "0 auto" }}>
        <svg viewBox="0 0 560 224" style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }} aria-hidden="true">
          {heroCells.map((c, i) => (
            <g key={`cell-${i}`}>
              <rect className={c.isLive ? "wb-pulse-tile" : undefined} x={c.x} y={c.y} width={cellW} height={cellH} rx="8" fill={c.isLive ? W.white : "none"} stroke={c.isLive ? W.mist : W.amber} strokeWidth={1} strokeDasharray={c.isLive ? undefined : "4 4"} style={c.isLive ? { animation: "wbPulse 4s ease-in-out infinite" } : undefined} />
              <text x={c.x + cellW / 2} y={c.y + 34} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="20" fill={c.isLive ? W.sky : W.amber}>{c.icon}</text>
              <text x={c.x + cellW / 2} y={c.y + 58} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill={c.isLive ? W.slate : W.amber} letterSpacing="0.1em" fontWeight="600">{c.name.toUpperCase()}</text>
            </g>
          ))}
          <rect x={gridX} y={190} width={500} height={8} rx={4} fill={W.mist} />
          <rect x={gridX} y={190} width={barWidth} height={8} rx={4} fill={W.sky} style={{ transition: "width 1200ms ease-out" }} />
          <text x={280} y={216} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#94A3B8" letterSpacing="0.1em">4 OF 17 MODULES LIVE · 13 COMING SOON</text>
        </svg>
      </div>

      {/* ── SECTION 4 — ORBITAL ── */}
      <section className="wb-orbital-section" style={{ background: W.white, padding: "80px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto 48px" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: W.slate, letterSpacing: "-0.02em", margin: "0 0 12px" }}>One layer. Every module connected.</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: W.steel, lineHeight: 1.5 }}>You don&apos;t configure the connections. They&apos;re already there.</p>
        </div>

        <OrbitalDiagram />
      </section>

      {/* ── SECTION 5 — MODULE CARDS ── */}
      <section className="wb-modules" style={{ background: W.cloud, padding: "80px 48px", borderTop: `1px solid ${W.mist}` }}>
        <div className="wb-modules-header" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 48px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.sky, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>THE FULL STACK</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: W.slate, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Everything your business needs.</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: W.steel, lineHeight: 1.5 }}>Start with what fits now. Add more as you grow.</p>
        </div>
        <div className="wb-module-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
          {MODULES.map((m) => {
            const isLive = m.status === "LIVE";
            return (
              <div key={m.name} style={{ background: W.white, border: `1px solid ${W.mist}`, borderRadius: 10, padding: 28, position: "relative" }}>
                <div style={{ position: "absolute", top: 16, right: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: isLive ? W.green : W.amber, padding: "3px 10px", borderRadius: 12, background: isLive ? W.greenBg : W.amberBg, border: `1px solid ${isLive ? "rgba(74,158,107,0.25)" : "rgba(196,154,60,0.25)"}` }}>{m.status}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: isLive ? W.sky : W.amber, marginBottom: 10, lineHeight: 1 }}>{m.icon}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: W.slate, marginBottom: 6, paddingRight: 90 }}>{m.name}</div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: W.steel, lineHeight: 1.5, margin: 0 }}>{m.desc}</p>
                {m.data && (<div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.sky, paddingTop: 10, marginTop: 12, borderTop: `1px solid ${W.mist}`, letterSpacing: "0.04em" }}>{m.data}</div>)}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 6 — PITCH ROW ── */}
      <div className="wb-pitch" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "64px 48px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: W.white, border: `1px solid ${W.mist}`, borderRadius: 10, padding: "40px 36px" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: W.slate, marginBottom: 14 }}>Your pace.</div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: W.steel, lineHeight: 1.6, margin: 0 }}>Start with Time Tracking. Add Payroll when you&apos;re ready. Add Invoicing after that. The connections are already wired. You just decide the order.</p>
        </div>
        <div style={{ background: W.skyBg, border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "40px 36px" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: W.slate, marginBottom: 14 }}>Pick what fits.</div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: W.steel, lineHeight: 1.6, margin: 0 }}>You&apos;re not buying a suite. You&apos;re building a stack. Start with Time Tracking. Add Invoicing when you&apos;re ready. The system grows when you do.</p>
        </div>
      </div>

      {/* ── SECTION 7 — DDL ATTRIBUTION BAR ── */}
      <div className="wb-attribution" style={{ background: W.slate, padding: "32px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <WBMark size={28} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>WorkBench</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>From the team that built AuditForge.</div>
          </div>
        </div>
        <div className="wb-attr-right" style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 4 }}>Dropdown Logistics · Chaos → Structured → Automated</div>
          <a href="/app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.sky, textDecoration: "none", letterSpacing: "0.04em" }}>Try AuditForge →</a>
        </div>
      </div>

      {/* ── SECTION 8 — FOOTER ── */}
      <footer className="wb-footer" style={{ background: W.fog, textAlign: "center", padding: "40px 32px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: W.slate, marginBottom: 6 }}>WorkBench</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: W.steel, marginBottom: 4 }}>A Dropdown Logistics product.</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#94A3B8" }}>hello@dropdownlogistics.com</div>
      </footer>
    </div>
  );
}
