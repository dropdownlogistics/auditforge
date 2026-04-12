// AuditForge — Coming Soon / Module Roadmap
// Public marketing page. Standalone. No app shell, no auth, no data fetching.
// CottageHumble design system throughout.

// ── CottageHumble palette (canonical, per CLAUDE.md) ──
const C = {
  navy:    "#0D1B2A",
  card:    "#10202f",
  cream:   "#F5F1EB",
  crimson: "#B23531",
  amber:   "#C49A3C",
  green:   "#4A9E6B",
  steel:   "#6B7B8D",
  slate:   "#4A5568",
  border:  "rgba(245,241,235,0.07)",
  borderLight: "rgba(245,241,235,0.04)",
};

// ── Module definitions ──
const MODULES = [
  {
    name:  "Controls",
    icon:  "▦",
    angle: -90,
    status: "LIVE",
    desc:  "106 controls across 9 process areas, mapped to risks, frameworks, and assertions with full workflow.",
    data:  "106 controls · 9 process areas",
  },
  {
    name:  "Teams",
    icon:  "◈",
    angle: -45,
    status: "LIVE",
    desc:  "47 auditors with verified skill tokens, basketball card competency profiles, and radar chart visualization.",
    data:  "47 auditors · 10 teams",
  },
  {
    name:  "Time Tracking",
    icon:  "◐",
    angle: 0,
    status: "LIVE",
    desc:  "Weekly time entry by engagement and component with billable/non-billable tracking and monthly trend.",
    data:  "1,099 entries · 4 engagements",
  },
  {
    name:  "Analytics",
    icon:  "⇄",
    angle: 45,
    status: "LIVE",
    desc:  "Engagement orbital with 6-node SVG architecture, live budget vs logged hours, and control coverage.",
    data:  "Live utilization · Billable %",
  },
  {
    name:  "Document Generation",
    icon:  "△",
    angle: 90,
    status: "LIVE",
    desc:  "One-click generation of RCM, MCL, Walkthrough, and Audit Plan documents from live control data.",
    data:  "4 document types",
  },
  {
    name:  "Capacity Planning",
    icon:  "⬡",
    angle: 135,
    status: "COMING SOON",
    desc:  "Real-time view of who can do what, when — skill matching, utilization projection, and revenue impact.",
    data:  null,
  },
  {
    name:  "Ledger Cards",
    icon:  "◇",
    angle: 180,
    status: "COMING SOON",
    desc:  "Verified engagement completion cards that travel with the auditor — portable, cryptographically signed proof of competency.",
    data:  null,
  },
  {
    name:  "Client Portal",
    icon:  "▷",
    angle: 225,
    status: "COMING SOON",
    desc:  "A read-only, beautifully designed surface for audit committee chairs — real-time engagement status without the PDF.",
    data:  null,
  },
];

// ── Orbital geometry ──
const cx = 350, cy = 250, orbitalR = 190, centerR = 52, nodeR = 38;
function polar(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}
const nodes = MODULES.map((m) => {
  const [x, y] = polar(m.angle, orbitalR);
  const [lsx, lsy] = polar(m.angle, centerR);
  return { ...m, x, y, lineStart: [lsx, lsy] };
});

// ── Mobile responsive styles ──
const pageStyles = `
  @media (max-width: 768px) {
    .cs-header { padding: 20px 16px !important; }
    .cs-headline { font-size: 28px !important; }
    .cs-subhead { font-size: 14px !important; }
    .cs-taxonomy { font-size: 8px !important; letter-spacing: 0.08em !important; }
    .cs-svg-wrap { padding: 0 8px !important; }
    .cs-grid { grid-template-columns: 1fr !important; padding: 0 16px !important; }
    .cs-footer { padding: 40px 16px !important; }
  }
`;

export const metadata = {
  title: "AuditForge — Coming Soon",
  description: "The Audit Firm Operating System. Modular. Star-schema. Built one governed module at a time.",
};

export default function ComingSoon() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.navy,
        color: C.cream,
        fontFamily: "'Source Serif 4', serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* ── SECTION 1 — HEADER ── */}
      <header
        className="cs-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 48px 0",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: C.cream,
            letterSpacing: "-0.01em",
          }}
        >
          AuditForge
        </div>
        <a
          href="/app"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: C.amber,
            textDecoration: "none",
            letterSpacing: "0.06em",
            padding: "6px 0",
          }}
        >
          ← Back to App
        </a>
      </header>

      {/* Headline block */}
      <div
        className="cs-header"
        style={{
          textAlign: "center",
          padding: "56px 32px 40px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <h1
          className="cs-headline"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 40,
            fontWeight: 700,
            color: C.cream,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            margin: "0 0 24px",
          }}
        >
          The Audit Firm Operating System
        </h1>
        <p
          className="cs-subhead"
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 16,
            color: C.cream,
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "0 auto 20px",
            opacity: 0.85,
          }}
        >
          AuditForge is being built one governed module at a time. Each module runs on the same star schema. Each one ships when it&apos;s ready.
        </p>
        <div
          className="cs-taxonomy"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: C.amber,
            letterSpacing: "0.12em",
            opacity: 0.9,
          }}
        >
          CONTROLS → TEAMS → TIME → UTILIZATION → CAPACITY → REVENUE → LIFECYCLE → PLATFORM
        </div>
      </div>

      {/* ── SECTION 2 — ORBITAL HERO ── */}
      <div
        className="cs-svg-wrap"
        style={{
          padding: "0 32px 56px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <svg
          viewBox="0 0 700 500"
          style={{
            width: "100%",
            maxWidth: 800,
            display: "block",
            margin: "0 auto",
            height: "auto",
          }}
          aria-hidden="true"
        >
          {/* Connecting lines — dashed, center-edge to node-center */}
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
            y={cy + 4}
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize="13"
            fontWeight="700"
            fill={C.cream}
          >
            AuditForge
          </text>

          {/* Surrounding nodes */}
          {nodes.map((n, i) => {
            const isLive = n.status === "LIVE";
            return (
              <g key={`node-${i}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeR}
                  fill={C.card}
                  stroke={isLive ? C.green : C.amber}
                  strokeWidth={isLive ? 2 : 1}
                  strokeDasharray={isLive ? undefined : "4 4"}
                />
                <text
                  x={n.x}
                  y={n.y - 4}
                  textAnchor="middle"
                  fontSize="18"
                  fill={C.cream}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {n.icon}
                </text>
                <text
                  x={n.x}
                  y={n.y + 16}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7"
                  fill={isLive ? C.green : C.amber}
                  letterSpacing="0.1em"
                  fontWeight="700"
                >
                  {n.status}
                </text>
                <text
                  x={n.x}
                  y={n.y + nodeR + 14}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="8"
                  fill={C.cream}
                  letterSpacing="0.1em"
                  opacity={0.8}
                >
                  {n.name.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── SECTION 3 — MODULE GRID ── */}
      <div
        className="cs-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          padding: "0 48px 80px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {MODULES.map((m) => {
          const isLive = m.status === "LIVE";
          return (
            <div
              key={m.name}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "24px 28px",
                position: "relative",
                transition: "border-color 200ms ease",
              }}
            >
              {/* Status pill top-right */}
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  right: 20,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: isLive ? C.green : C.amber,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: isLive ? "rgba(74,158,107,0.12)" : "rgba(196,154,60,0.12)",
                  border: `1px solid ${isLive ? "rgba(74,158,107,0.3)" : "rgba(196,154,60,0.3)"}`,
                }}
              >
                {m.status}
              </div>

              {/* Icon + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingRight: 110 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 22,
                    color: isLive ? C.green : C.amber,
                    lineHeight: 1,
                  }}
                >
                  {m.icon}
                </span>
                <h2
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.cream,
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  {m.name}
                </h2>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: 13,
                  color: C.steel,
                  lineHeight: 1.6,
                  margin: "0 0 12px",
                }}
              >
                {m.desc}
              </p>

              {/* Data point — only for LIVE modules */}
              {m.data && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: C.amber,
                    letterSpacing: "0.05em",
                    paddingTop: 10,
                    borderTop: `1px solid ${C.borderLight}`,
                  }}
                >
                  {m.data}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SECTION 4 — FOOTER ── */}
      <footer
        className="cs-footer"
        style={{
          textAlign: "center",
          padding: "56px 32px 48px",
          borderTop: `1px solid ${C.border}`,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: C.cream,
            marginBottom: 8,
          }}
        >
          Built by Dropdown Logistics
        </div>
        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 12,
            color: C.cream,
            opacity: 0.7,
            marginBottom: 14,
          }}
        >
          Chaos → Structured → Automated
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: C.amber,
            letterSpacing: "0.12em",
          }}
        >
          auditforge.dev
        </div>
      </footer>
    </div>
  );
}
