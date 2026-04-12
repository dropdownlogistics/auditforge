// WorkBench — Promotional Landing Page
// Standalone public marketing page. No app shell, no auth, no data fetching.
// WorkBench Light design system — light mode only.

// ── WorkBench Light palette ──
const W = {
  fog:     "#F0F4F8",
  white:   "#FFFFFF",
  cloud:   "#E8EDF2",
  slate:   "#1E293B",
  iron:    "#334155",
  steel:   "#64748B",
  mist:    "#E2E8F0",
  sky:     "#3B82F6",
  green:   "#4A9E6B",
  amber:   "#C49A3C",
  skyBg:   "#EFF6FF",
  greenBg: "#F0FDF4",
  amberBg: "#FFFBEB",
};

// ── All 17 modules ──
const MODULES = [
  { name: "Controls",          icon: "▦", status: "LIVE",        desc: "106 controls across 9 process areas, mapped to risks, frameworks, and assertions with full workflow.",                     data: "106 controls · 9 process areas" },
  { name: "Teams",             icon: "◈", status: "LIVE",        desc: "47 auditors with verified skill tokens, basketball card profiles, and radar chart visualization.",                         data: "47 auditors · 10 teams" },
  { name: "Time Tracking",     icon: "◐", status: "LIVE",        desc: "Weekly time entry by engagement and component with billable/non-billable tracking and monthly trends.",                   data: "1,099 entries · 4 engagements" },
  { name: "Analytics",         icon: "⇄", status: "LIVE",        desc: "Live dashboards showing budget vs actual hours, billable percentage, and control coverage by engagement.",                data: "Live utilization · Billable %" },
  { name: "HR & People",       icon: "◫", status: "COMING SOON", desc: "Employee records, org chart, role management, and onboarding checklists — connected to your time data.",                  data: null },
  { name: "Payroll",           icon: "◎", status: "COMING SOON", desc: "Pay runs built from your logged hours. No double entry. The time data is already there.",                                data: null },
  { name: "Capacity Planning", icon: "⬡", status: "COMING SOON", desc: "Who can do what, when — skill matching, utilization projection, and revenue impact in one view.",                        data: null },
  { name: "Invoicing",         icon: "△", status: "COMING SOON", desc: "Turn logged hours into invoices. One click from time entry to client-ready document.",                                   data: null },
  { name: "Accounting",        icon: "⊞", status: "COMING SOON", desc: "Chart of accounts, P&L, balance sheet. The books live where the work lives.",                                           data: null },
  { name: "Expenses",          icon: "◁", status: "COMING SOON", desc: "Log it, categorize it, reconcile it. Receipts in, reports out.",                                                        data: null },
  { name: "Documents",         icon: "▣", status: "COMING SOON", desc: "Contracts, SOPs, policies. Version controlled. One place.",                                                              data: null },
  { name: "Scheduling",        icon: "◷", status: "COMING SOON", desc: "Who's working when. Connected to capacity and time.",                                                                   data: null },
  { name: "CRM",               icon: "◉", status: "COMING SOON", desc: "Client records, contacts, engagement history. The relationship layer.",                                                  data: null },
  { name: "Reporting",         icon: "▤", status: "COMING SOON", desc: "Pull any metric across any module. One dashboard, your numbers.",                                                        data: null },
  { name: "Integrations",      icon: "⟳", status: "COMING SOON", desc: "QuickBooks, Stripe, Gusto. WorkBench connects to what you already have.",                                               data: null },
  { name: "Ledger Cards",      icon: "◇", status: "COMING SOON", desc: "Verified work history that travels with your team. Portable, cryptographically signed, and yours.",                      data: null },
  { name: "Client Portal",     icon: "▷", status: "COMING SOON", desc: "A read-only window into your work for clients and stakeholders — real-time status without the PDF.",                     data: null },
];

// ── Injected styles: Inter font + mobile responsive ──
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  @media (max-width: 768px) {
    .wb-nav { padding: 16px !important; flex-wrap: wrap; gap: 12px !important; }
    .wb-hero { padding: 40px 16px !important; }
    .wb-headline { font-size: 32px !important; }
    .wb-subhead { font-size: 14px !important; }
    .wb-chip-row { flex-wrap: wrap !important; justify-content: center !important; }
    .wb-svg-wrap { padding: 0 12px 48px !important; }
    .wb-modules { padding: 48px 16px !important; }
    .wb-module-grid { grid-template-columns: 1fr !important; }
    .wb-pitch { grid-template-columns: 1fr !important; padding: 0 16px 56px !important; }
    .wb-attribution { flex-direction: column !important; gap: 16px !important; text-align: center !important; padding: 24px 16px !important; }
    .wb-attr-right { text-align: center !important; }
    .wb-footer { padding: 32px 16px !important; }
    .wb-modules-header h2 { font-size: 24px !important; }
  }
`;

// ── WorkBench mark SVG component (3×2 grid of rounded squares + progress bar) ──
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

export const metadata = {
  title: "WorkBench — Build the Stack Your Business Actually Needs",
  description: "A modular small business operating system from the team that built AuditForge. Pick what fits. Leave what doesn't.",
  openGraph: {
    title: "WorkBench — Modular Business OS",
    description: "Pick what fits. Leave what doesn't. Every module connects from day one.",
  },
};

export default function WorkBenchPage() {
  // Module Grid Hero cells — first 6 modules in a 3×2 preview grid
  const heroModules = MODULES.slice(0, 6);
  const cellW = 160, cellH = 80, gap = 10, gridX = 30;
  const heroCells = heroModules.map((m, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = gridX + col * (cellW + gap);
    const y = row * (cellH + gap);
    const isLive = m.status === "LIVE";
    return { ...m, x, y, isLive };
  });

  return (
    <div style={{ minHeight: "100vh", background: W.fog, color: W.slate, fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* ── SECTION 1 — NAV BAR ── */}
      <nav className="wb-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <WBMark size={36} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: W.slate }}>Work</span>
            <span style={{ color: W.sky }}>Bench</span>
          </span>
        </div>
        <a href="/app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.steel, textDecoration: "none", letterSpacing: "0.04em" }}>
          Built on AuditForge →
        </a>
      </nav>

      {/* ── SECTION 2 — HERO ── */}
      <section className="wb-hero" style={{ textAlign: "center", padding: "56px 32px 40px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: W.sky, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20, fontWeight: 500 }}>
          MODULAR BUSINESS OS · FROM DROPDOWN LOGISTICS
        </div>
        <h1 className="wb-headline" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 700, color: W.slate, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 24px" }}>
          Build the stack{"\n"}your business{"\n"}actually needs.
        </h1>
        <p className="wb-subhead" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: W.steel, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>
          Pick what fits. Leave what doesn&apos;t. WorkBench modules run on the same data layer — so everything you choose connects from day one.
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

      {/* ── SECTION 3 — MODULE GRID HERO (mini SVG) ── */}
      <div className="wb-svg-wrap" style={{ padding: "0 32px 64px", maxWidth: 700, margin: "0 auto" }}>
        <svg viewBox="0 0 560 224" style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }} aria-hidden="true">
          {heroCells.map((c, i) => (
            <g key={`cell-${i}`}>
              <rect x={c.x} y={c.y} width={cellW} height={cellH} rx="8" fill={c.isLive ? W.white : "none"} stroke={c.isLive ? W.mist : W.amber} strokeWidth={c.isLive ? 1 : 1} strokeDasharray={c.isLive ? undefined : "4 4"} />
              <text x={c.x + cellW / 2} y={c.y + 34} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="20" fill={c.isLive ? W.sky : W.amber}>{c.icon}</text>
              <text x={c.x + cellW / 2} y={c.y + 58} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill={c.isLive ? W.slate : W.amber} letterSpacing="0.1em" fontWeight="600">{c.name.toUpperCase()}</text>
            </g>
          ))}
          {/* Progress bar */}
          <rect x={gridX} y={190} width={500} height={8} rx={4} fill={W.mist} />
          <rect x={gridX} y={190} width={Math.round(500 * (4 / 17))} height={8} rx={4} fill={W.sky} />
          {/* Caption */}
          <text x={280} y={216} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#94A3B8" letterSpacing="0.1em">
            4 OF 17 MODULES LIVE · 13 COMING SOON
          </text>
        </svg>
      </div>

      {/* ── SECTION 4 — MODULE CARDS (full 17) ── */}
      <section className="wb-modules" style={{ background: W.cloud, padding: "80px 48px" }}>
        <div className="wb-modules-header" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 48px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: W.sky, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>
            THE FULL STACK
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: W.slate, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Everything your business needs.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: W.steel, lineHeight: 1.5 }}>
            Start with what fits now. Add more as you grow.
          </p>
        </div>

        <div className="wb-module-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 1000, margin: "0 auto" }}>
          {MODULES.map((m) => {
            const isLive = m.status === "LIVE";
            return (
              <div key={m.name} style={{ background: W.white, border: `1px solid ${W.mist}`, borderRadius: 10, padding: 24, position: "relative" }}>
                {/* Status pill */}
                <div style={{
                  position: "absolute", top: 16, right: 16,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  color: isLive ? W.green : W.amber,
                  padding: "3px 10px", borderRadius: 12,
                  background: isLive ? W.greenBg : W.amberBg,
                  border: `1px solid ${isLive ? "rgba(74,158,107,0.25)" : "rgba(196,154,60,0.25)"}`,
                }}>
                  {m.status}
                </div>
                {/* Icon */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: isLive ? W.sky : W.amber, marginBottom: 10, lineHeight: 1 }}>
                  {m.icon}
                </div>
                {/* Name */}
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: W.slate, marginBottom: 6, paddingRight: 90 }}>
                  {m.name}
                </div>
                {/* Description */}
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: W.steel, lineHeight: 1.5, margin: 0 }}>
                  {m.desc}
                </p>
                {/* Data line for LIVE modules */}
                {m.data && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.sky, paddingTop: 10, marginTop: 12, borderTop: `1px solid ${W.mist}`, letterSpacing: "0.04em" }}>
                    {m.data}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 5 — PITCH ROW ── */}
      <div className="wb-pitch" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "64px 48px", maxWidth: 900, margin: "0 auto" }}>
        {/* Left card — white */}
        <div style={{ background: W.white, border: `1px solid ${W.mist}`, borderRadius: 10, padding: "32px 28px" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: W.slate, marginBottom: 14 }}>
            One layer.
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: W.steel, lineHeight: 1.6, margin: 0 }}>
            Every module runs on the same data layer. Time feeds payroll. Controls feed analytics. Teams feed capacity. You don&apos;t configure the connections — they&apos;re already there.
          </p>
        </div>
        {/* Right card — sky bg */}
        <div style={{ background: W.skyBg, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 10, padding: "32px 28px" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: W.slate, marginBottom: 14 }}>
            Pick what fits.
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: W.steel, lineHeight: 1.6, margin: 0 }}>
            You&apos;re not buying a suite. You&apos;re building a stack. Start with Time Tracking. Add Invoicing when you&apos;re ready. The system grows when you do.
          </p>
        </div>
      </div>

      {/* ── SECTION 6 — DDL ATTRIBUTION BAR ── */}
      <div className="wb-attribution" style={{ background: W.slate, padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <WBMark size={28} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
              WorkBench
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              From the team that built AuditForge.
            </div>
          </div>
        </div>
        <div className="wb-attr-right" style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 4 }}>
            Dropdown Logistics · Chaos → Structured → Automated
          </div>
          <a href="/app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: W.sky, textDecoration: "none", letterSpacing: "0.04em" }}>
            Try AuditForge →
          </a>
        </div>
      </div>

      {/* ── SECTION 7 — FOOTER ── */}
      <footer className="wb-footer" style={{ background: W.fog, textAlign: "center", padding: "40px 32px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: W.slate, marginBottom: 6 }}>
          WorkBench
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: W.steel }}>
          A Dropdown Logistics product.
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: W.amber, marginTop: 8, letterSpacing: "0.12em" }}>
          COMING SOON
        </div>
      </footer>
    </div>
  );
}
