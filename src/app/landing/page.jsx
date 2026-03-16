"use client";
import { useEffect, useRef, useState } from "react";

const C = {
  navy: "#0D1B2A",
  card: "#10202f",
  cream: "#F5F1EB",
  crimson: "#B23531",
  copper: "#C49A3C",
  steel: "#6B7B8D",
  border: "rgba(245,241,235,0.07)",
  borderCopper: "rgba(196,154,60,0.3)",
};

const TICKER_ITEMS = [
  "RCM", "MCL", "WALKTHROUGH", "AUDIT PLAN",
  "STAR SCHEMA", "RISK MAPPING", "EVIDENCE PACKAGE",
  "GOVERNED DOCUMENTATION", "CONTROL TESTING",
  "SEGREGATION OF DUTIES", "AUDIT TRAIL",
  "FRAMEWORK MAPPING", "PROCESS COVERAGE",
];

function useScrollFade() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeSection({ children, delay = 0, style = {} }) {
  const [ref, visible] = useScrollFade();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  );
}

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      padding: "10px 0",
      overflow: "hidden",
      background: "rgba(13,27,42,0.6)",
    }}>
      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .af-ticker-track { display: flex; gap: 0; animation: ticker 28s linear infinite; width: max-content; }
        .af-ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="af-ticker-track">
        {items.map((item, i) => (
          <span key={i} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            color: i % 3 === 0 ? C.crimson : C.steel,
            letterSpacing: "0.08em",
            padding: "0 28px",
            whiteSpace: "nowrap",
          }}>
            {item} <span style={{ color: C.border, marginLeft: 8 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function OrbitalHero() {
  const arms = [
    { label: ["System of", "Structure"], sub: "What AuditForge is", angle: 270, color: C.crimson },
    { label: ["RCM · MCL", "Walkthrough"], sub: "What it generates", angle: 30, color: C.copper },
    { label: ["Star Schema"], sub: "How it's built", angle: 95, color: C.steel },
    { label: ["Governed by", "Council"], sub: "10 seats · 3 verdicts", angle: 185, color: C.steel },
    { label: ["Live Data"], sub: "Your workspace", angle: 220, color: C.copper },
  ];

  const R = 148;
  const cx = 230;
  const cy = 210;

  return (
    <svg viewBox="0 0 500 420" style={{ width: "100%", maxWidth: 500, opacity: 0.93 }}>
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.crimson} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.navy} stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin-rev  { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
          @keyframes pulse-node { 0%,100% { opacity:0.9; } 50% { opacity:1; } }
          .orb-ring-1 { transform-origin: 230px 210px; animation: spin-slow 18s linear infinite; }
          .orb-ring-2 { transform-origin: 230px 210px; animation: spin-rev 28s linear infinite; }
        `}</style>
      </defs>

      <circle cx={cx} cy={cy} r={R} fill="url(#orbGrad)" />
      <circle className="orb-ring-2" cx={cx} cy={cy} r={R + 22}
        fill="none" stroke="rgba(245,241,235,0.04)" strokeWidth="1" />
      <circle className="orb-ring-1" cx={cx} cy={cy} r={R}
        fill="none" stroke="rgba(196,154,60,0.2)" strokeWidth="1" strokeDasharray="5 10" />

      {arms.map((arm, i) => {
        const rad = (arm.angle * Math.PI) / 180;
        const nx = cx + R * Math.cos(rad);
        const ny = cy + R * Math.sin(rad);
        const isRight = nx > cx;
        const labelX = nx + (isRight ? 12 : -12);
        const anchor = isRight ? "start" : "end";
        const lineCount = arm.label.length;
        const startY = ny - (lineCount * 11 + 8) / 2;

        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={nx} y2={ny}
              stroke={arm.color} strokeWidth="0.75" strokeOpacity="0.45" />
            <circle cx={nx} cy={ny} r="5" fill={arm.color} fillOpacity="0.9"
              style={{ animation: `pulse-node 3s ease-in-out ${i * 0.6}s infinite` }} />
            {arm.label.map((line, li) => (
              <text key={li} x={labelX} y={startY + li * 11 + 9}
                textAnchor={anchor} fill={C.cream} fontSize="9"
                fontFamily="'Space Grotesk', sans-serif" fontWeight="600">
                {line}
              </text>
            ))}
            <text x={labelX} y={startY + lineCount * 11 + 10}
              textAnchor={anchor} fill={C.steel} fontSize="7.5"
              fontFamily="'JetBrains Mono', monospace">
              {arm.sub}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="48" fill={C.crimson} />
      <circle cx={cx} cy={cy} r="44" fill="none" stroke="rgba(245,241,235,0.2)" strokeWidth="1" />
      <text x={cx} y={cy - 6} textAnchor="middle"
        fill={C.cream} fontSize="22" fontFamily="'Space Grotesk', sans-serif" fontWeight="800" letterSpacing="1">
        AF
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fill="rgba(245,241,235,0.5)" fontSize="6.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
        AUDITFORGE
      </text>
    </svg>
  );
}


function StatGrid() {
  const stats = [
    { value: "4", label: "Document Types", sub: "RCM · MCL · Walk · Plan" },
    { value: "3", label: "Frameworks", sub: "COSO · SOX · COBIT" },
    { value: "<30s", label: "To Package", sub: "From live star schema" },
    { value: "0", label: "Manual Formatting", sub: "Structure is the product" },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 1,
      background: C.border,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: C.card,
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: C.crimson,
            lineHeight: 1,
            marginBottom: 8,
          }}>{s.value}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: C.cream,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>{s.label}</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: C.steel,
          }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function FeatureCards() {
  const features = [
    {
      id: "01",
      title: "Risk & Control Matrix",
      abbr: "RCM",
      body: "Control ID, description, process area, type, key flag, mapped risks, assertions, and framework references. One sheet. Every engagement.",
      color: C.crimson,
    },
    {
      id: "02",
      title: "Master Control List",
      abbr: "MCL",
      body: "Full control catalog across all process areas. Filtered, sorted, formatted. The complete inventory your audit committee expects.",
      color: C.copper,
    },
    {
      id: "03",
      title: "Walkthrough Package",
      abbr: "WALK",
      body: "Process narrative, control descriptions, risk-control linkages, and test procedures. One document per process area. DOCX, print-ready.",
      color: C.steel,
    },
    {
      id: "04",
      title: "Audit Plan",
      abbr: "PLAN",
      body: "Cover sheet, scope matrix, timeline, auditor assignments, and budget hours. The planning package your team needs on day one.",
      color: "#4A9E6B",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {features.map((f) => (
        <div key={f.id} style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "28px 28px 24px",
          borderTop: `2px solid ${f.color}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: f.color,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}>{f.abbr}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "rgba(245,241,235,0.2)",
            }}>{f.id}</span>
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: C.cream,
            marginBottom: 10,
            lineHeight: 1.3,
          }}>{f.title}</div>
          <div style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 13,
            color: C.steel,
            lineHeight: 1.6,
          }}>{f.body}</div>
        </div>
      ))}
    </div>
  );
}

function CanonBlock() {
  return (
    <div style={{
      border: `1px solid ${C.borderCopper}`,
      borderLeft: `3px solid ${C.copper}`,
      background: "rgba(196,154,60,0.04)",
      borderRadius: 10,
      padding: "32px 36px",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: C.copper,
        letterSpacing: "0.12em",
        marginBottom: 12,
        textTransform: "uppercase",
      }}>Canon Term · SystemOfStructure</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22,
        fontWeight: 700,
        color: C.cream,
        marginBottom: 14,
      }}>Not execution. Not opinion. Structure.</div>
      <div style={{
        fontFamily: "'Source Serif 4', serif",
        fontSize: 14,
        color: C.steel,
        lineHeight: 1.7,
        maxWidth: 620,
      }}>
        AuditForge is the architectural identity of governed audit documentation.
        The auditor issues the opinion. AuditForge produces the evidence package.{" "}
        <span style={{ color: C.cream, fontStyle: "italic" }}>That line does not move.</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: C.navy, minHeight: "100vh", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400;1,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(178,53,49,0.35); }
        @media (max-width: 768px) {
          .af-hero-grid { flex-direction: column !important; }
          .af-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .af-feature-grid { grid-template-columns: 1fr !important; }
          .af-hero-text { padding-right: 0 !important; }
          .af-orbital { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 48px",
        height: 56,
        borderBottom: `1px solid ${C.border}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(13,27,42,0.95)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: C.crimson,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10, fontWeight: 800, color: C.cream, letterSpacing: "0.5px",
          }}>AF</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: C.cream }}>
            Audit<span style={{ color: C.crimson }}>Forge</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/llms.txt" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: C.steel, textDecoration: "none", letterSpacing: "0.06em",
          }}>OperatorManifest</a>
          <a href="/app" style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "6px 16px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 600, color: C.cream,
            textDecoration: "none", cursor: "pointer",
          }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "72px 48px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div className="af-hero-grid" style={{ display: "flex", alignItems: "center", gap: 48, minHeight: 480 }}>
          {/* Text */}
          <div className="af-hero-text" style={{ flex: 1, paddingRight: 24 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 600,
              color: C.crimson, letterSpacing: "0.14em",
              marginBottom: 20, textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ display: "inline-block", width: 24, height: 1, background: C.crimson }} />
              Governed Documentation · auditforge.dev
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 58, fontWeight: 800,
              color: C.cream, lineHeight: 1.05,
              marginBottom: 6,
            }}>
              The audit package
            </h1>
            <h1 style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 58, fontWeight: 600,
              color: C.crimson, fontStyle: "italic",
              lineHeight: 1.05, marginBottom: 28,
            }}>
              generates itself.
            </h1>

            <p style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 15, color: C.steel, lineHeight: 1.7,
              maxWidth: 480, marginBottom: 8,
            }}>
              AuditForge takes your control and risk data and produces{" "}
              <span style={{ color: C.cream, fontWeight: 600 }}>governed audit deliverables</span>
              {" "}— RCMs, MCLs, walkthroughs, and audit plans — in seconds from a live star schema.
            </p>
            <p style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 13, color: C.steel, marginBottom: 36,
              fontStyle: "italic",
            }}>
              The auditor issues the opinion. AuditForge produces the evidence package.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/app" style={{
                background: C.crimson,
                border: `1px solid ${C.crimson}`,
                borderRadius: 7, padding: "12px 28px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 700, color: C.cream,
                textDecoration: "none", letterSpacing: "0.02em",
                transition: "opacity 0.15s",
              }}
                onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                See It Live →
              </a>
              <a href="/sign-in" style={{
                background: "transparent",
                border: `1px solid rgba(245,241,235,0.18)`,
                borderRadius: 7, padding: "12px 28px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 600, color: C.cream,
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
                onMouseOver={e => e.currentTarget.style.borderColor = "rgba(245,241,235,0.4)"}
                onMouseOut={e => e.currentTarget.style.borderColor = "rgba(245,241,235,0.18)"}
              >
                Sign In
              </a>
            </div>

            <div style={{
              marginTop: 40,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, color: "rgba(245,241,235,0.2)",
              letterSpacing: "0.08em",
            }}>
              auditforge.dev · dropdownlogistics.com
            </div>
          </div>

          {/* Orbital */}
          <div className="af-orbital" style={{ width: 440, flexShrink: 0 }}>
            <OrbitalHero />
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div style={{ marginTop: 40 }}>
        <Ticker />
      </div>

      {/* Stats */}
      <section style={{ padding: "64px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <div className="af-stat-grid">
            <StatGrid />
          </div>
        </FadeSection>
      </section>

      {/* Features */}
      <section style={{ padding: "0 48px 64px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: C.copper,
            letterSpacing: "0.12em", textTransform: "uppercase",
            marginBottom: 8,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ width: 20, height: 1, background: C.copper, display: "inline-block" }} />
            What It Generates
          </div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 32, fontWeight: 800, color: C.cream, marginBottom: 32,
          }}>
            Four documents.<br />
            <span style={{ color: C.steel, fontWeight: 400, fontSize: 28 }}>
              Every engagement.
            </span>
          </h2>
        </FadeSection>
        <FadeSection delay={100}>
          <div className="af-feature-grid">
            <FeatureCards />
          </div>
        </FadeSection>
      </section>

      {/* Canon Term */}
      <section style={{ padding: "0 48px 64px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <CanonBlock />
        </FadeSection>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: "64px 48px",
        borderTop: `1px solid ${C.border}`,
        maxWidth: 1200, margin: "0 auto",
        textAlign: "center",
      }}>
        <FadeSection>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 40, fontWeight: 800,
            color: C.cream, marginBottom: 8, lineHeight: 1.1,
          }}>
            The forge is live.
          </div>
          <div style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 18, color: C.steel,
            fontStyle: "italic", marginBottom: 36,
          }}>
            Enter the dashboard. See the data move.
          </div>
          <a href="/app" style={{
            background: C.crimson, border: `1px solid ${C.crimson}`,
            borderRadius: 8, padding: "14px 40px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14, fontWeight: 700, color: C.cream,
            textDecoration: "none", display: "inline-block",
          }}>
            See It Live →
          </a>
        </FadeSection>
      </section>

      {/* Receipt Line */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: "20px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: "rgba(245,241,235,0.2)",
          letterSpacing: "0.08em",
        }}>
          One operator · One council · The audit package generates itself.
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: "rgba(245,241,235,0.15)",
          letterSpacing: "0.06em",
        }}>
          A Dropdown Logistics product · Chaos → Structured → Automated
        </span>
      </footer>
    </div>
  );
}
