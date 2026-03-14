"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

const ARMS = [
  { label: "System of Structure",  sub: "What AuditForge is",       angle: -90,  color: "#B23531" },
  { label: "RCM · MCL · Walkthrough", sub: "What it generates",     angle: -22,  color: "#C49A3C" },
  { label: "Star Schema",          sub: "How it's built",            angle: 50,   color: "#6B9DC2" },
  { label: "Governed by Council",  sub: "10 seats. 3 reviews.",      angle: 130,  color: "#8a6cc9" },
  { label: "Sign In →",           sub: "Access your workspace.",     angle: 200,  color: "#4A9E6B", cta: true },
];

const FEATURES = [
  { title: "Risk Control Matrix",    desc: "Every control mapped to risks, frameworks, and assertions. One query. Branded XLSX. Client-ready in seconds.",        color: "#B23531" },
  { title: "Management Control Listing", desc: "Full control catalog with status, effectiveness, and type. The document you hand a client at engagement open.",  color: "#C49A3C" },
  { title: "Walkthrough Narratives", desc: "One per process area. Control points, risk summary, gap analysis, sign-off block. DOCX. Professional standard.",    color: "#6B9DC2" },
  { title: "Audit Plan",             desc: "Scope matrix, assignments, target dates. Generated from live engagement data. Not a template — a governed artifact.", color: "#4A9E6B" },
  { title: "Analytics Dashboard",    desc: "Coverage rate, unmitigated risk, key controls not tested, workflow funnel. Real-time. Council-ratified KPIs.",       color: "#8a6cc9" },
  { title: "Import & Search",        desc: "CSV import with auto-mapping and validation. Cmd+K global search across controls, risks, and processes.",           color: "#C49A3C" },
];

function RadialStamp({ visible }) {
  const ARM_LEN = 155;
  const STAMP_R = 54;
  const CX = 260;
  const CY = 260;

  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 520, margin: "0 auto",
      opacity: visible ? 1 : 0, transition: "opacity 1s ease 0.3s",
    }}>
      <svg viewBox="0 0 520 520" style={{ width: "100%", height: "auto" }}>
        {/* Orbit rings */}
        <circle cx={CX} cy={CY} r={ARM_LEN + 52} fill="none" stroke="#B23531" strokeWidth="0.3" strokeOpacity="0.08" />
        <circle cx={CX} cy={CY} r={ARM_LEN + 18} fill="none" stroke="#B23531" strokeWidth="0.5" strokeOpacity="0.18" />

        {/* Rotating arc */}
        <circle cx={CX} cy={CY} r={ARM_LEN + 18} fill="none" stroke="#B23531" strokeWidth="1.5"
          strokeDasharray={`${(ARM_LEN + 18) * 0.38} ${(ARM_LEN + 18) * 6}`} strokeLinecap="round" opacity="0.55"
          style={{ animation: "spin 18s linear infinite", transformOrigin: `${CX}px ${CY}px` }} />

        {/* Arms + dots */}
        {ARMS.map((arm, i) => {
          const rad = (arm.angle * Math.PI) / 180;
          const x1 = CX + STAMP_R * Math.cos(rad);
          const y1 = CY + STAMP_R * Math.sin(rad);
          const x2 = CX + ARM_LEN * Math.cos(rad);
          const y2 = CY + ARM_LEN * Math.sin(rad);
          const nx = x2;
          const ny = y2;
          const isRight = nx > CX + 15;
          const isLeft = nx < CX - 15;
          const bx = isRight ? nx + 10 : isLeft ? nx - 148 : nx - 74;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={arm.color} strokeWidth="0.8" strokeOpacity="0.4"
                style={{ animation: `armIn 0.8s ${0.9 + i * 0.13}s ease forwards`, opacity: 0 }} />
              <circle cx={nx} cy={ny} r={5} fill="#0D1B2A" stroke={arm.color} strokeWidth="1.2"
                style={{ animation: `fadeIn 0.4s ${1.5 + i * 0.13}s ease forwards`, opacity: 0 }} />
              <circle cx={nx} cy={ny} r={2.5} fill={arm.color}
                style={{ animation: `fadeIn 0.4s ${1.5 + i * 0.13}s ease forwards`, opacity: 0 }} />
              <g style={{ animation: `fadeIn 0.6s ${2.2 + i * 0.1}s ease forwards`, opacity: 0 }}>
                <rect x={bx} y={ny - 22} width={138} height={44} rx={7}
                  fill="#10202f" stroke={arm.color} strokeWidth="0.5" strokeOpacity="0.25" />
                <text x={bx + 10} y={ny - 5}
                  fontFamily="'Space Grotesk',sans-serif" fontSize="11.5" fontWeight={arm.cta ? "700" : "600"}
                  fill={arm.cta ? arm.color : "#F5F1EB"} letterSpacing="0.01em">{arm.label}</text>
                <text x={bx + 10} y={ny + 13}
                  fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#4a6080" letterSpacing="0.04em">{arm.sub}</text>
              </g>
            </g>
          );
        })}

        {/* Center stamp */}
        <circle cx={CX} cy={CY} r={STAMP_R + 4} fill="none" stroke="#B23531" strokeWidth="0.5" strokeOpacity="0.2" />
        <circle cx={CX} cy={CY} r={STAMP_R} fill="#B23531" />
        <circle cx={CX} cy={CY} r={STAMP_R - 6} fill="none" stroke="#F5F1EB" strokeWidth="0.8" strokeOpacity="0.25" />
        <text x={CX} y={CY + 8} textAnchor="middle"
          fontFamily="'Space Grotesk',sans-serif" fontWeight="900" fontSize="28" fill="#F5F1EB" letterSpacing="-0.5">AF</text>
        <text x={CX} y={CY + 22} textAnchor="middle"
          fontFamily="'JetBrains Mono',monospace" fontSize="5.5" fill="#F5F1EB" opacity="0.4" letterSpacing="2.8">AUDITFORGE</text>
      </svg>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes armIn { from { opacity: 0; stroke-dashoffset: 100 } to { opacity: 1; stroke-dashoffset: 0 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const { signIn, setActive } = useSignIn();
  const router = useRouter();

  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);

  async function handleGuest(e) {
    e.preventDefault();
    if (!signIn) return;
    setGuestLoading(true);
    try {
      const result = await signIn.create({
        identifier: "demo@auditforge.dev",
        password: "DDLogistics!9*6",
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err) {
      console.error("Guest sign in failed:", err);
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --navy: #0D1B2A; --card: #10202f; --cream: #F5F1EB;
          --crimson: #B23531; --amber: #C49A3C; --steel: #4a6080;
          --border: rgba(245,241,235,0.07); --border-crimson: rgba(178,53,49,0.25);
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'Space Grotesk', sans-serif; background: var(--navy); color: var(--cream); overflow-x: hidden; min-height: 100vh; }

        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 48px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(12px); background: rgba(13,27,42,0.9); border-bottom: 1px solid var(--border); }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-text { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
        .logo-text span { color: var(--crimson); }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--steel); letter-spacing: 0.06em; }
        .nav-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--crimson); border: 1px solid var(--border-crimson); padding: 4px 12px; border-radius: 20px; letter-spacing: 0.08em; }
        .btn-signin { background: var(--crimson); color: var(--cream); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 10px 22px; border-radius: 6px; border: none; cursor: pointer; transition: transform 0.2s, opacity 0.2s; }
        .btn-signin:hover { opacity: 0.9; transform: translateY(-1px); }

        .hero { position: relative; z-index: 1; min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 40px; padding: 120px 64px 80px; max-width: 1240px; margin: 0 auto; }
        .hero-text { display: flex; flex-direction: column; }
        .hero-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--crimson); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 22px; opacity: 0; animation: fadeUp 0.7s 0.2s ease forwards; }
        .hero h1 { font-size: clamp(2.4rem, 4vw, 3.8rem); font-weight: 700; line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 20px; opacity: 0; animation: fadeUp 0.7s 0.3s ease forwards; }
        .hero h1 em { font-style: italic; font-family: 'Source Serif 4', serif; font-weight: 400; color: var(--crimson); }
        .hero-sub { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--steel); max-width: 420px; line-height: 1.9; margin-bottom: 36px; opacity: 0; animation: fadeUp 0.7s 0.4s ease forwards; }
        .hero-sub strong { color: var(--amber); font-weight: 500; }
        .cta-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; opacity: 0; animation: fadeUp 0.7s 0.5s ease forwards; }
        .btn-primary { background: var(--crimson); color: var(--cream); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 13px 28px; border-radius: 6px; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(178,53,49,0.3); }
        .btn-secondary { background: transparent; color: var(--steel); font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 13px 20px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-secondary:hover { border-color: var(--border-crimson); color: var(--cream); }
        .btn-guest { background: #0D1B2A; color: var(--cream); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 13px 28px; border-radius: 6px; border: 2px solid var(--crimson); cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.2s; }
        .btn-guest:hover { background: rgba(178,53,49,0.1); transform: translateY(-1px); }
        .cta-sub { margin-top: 14px; opacity: 0; animation: fadeUp 0.7s 0.6s ease forwards; }
        .btn-manifest { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--steel); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; }
        .btn-manifest:hover { color: var(--cream); }
        .cta-hint { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #1a2e42; letter-spacing: 0.06em; margin-top: 14px; }
        .stamp-col { opacity: 0; animation: fadeUp 0.9s 0.25s ease forwards; }

        .divider-strip { position: relative; z-index: 1; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 12px 0; overflow: hidden; background: rgba(16,32,47,0.6); }
        .ticker-inner { display: flex; gap: 48px; animation: ticker 28s linear infinite; white-space: nowrap; width: max-content; }
        .ticker-item { display: flex; align-items: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
        .ticker-label { color: var(--steel); letter-spacing: 0.08em; text-transform: uppercase; }
        .ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }

        .stats-section { position: relative; z-index: 1; max-width: 1100px; margin: 60px auto; padding: 0 40px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .stat-card { background: var(--card); padding: 28px 24px; }
        .stat-num { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 6px; }
        .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--steel); letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.5; }
        .stat-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; margin-top: 8px; color: var(--steel); }

        .features-section { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto 80px; padding: 0 40px; }
        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--crimson); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 10px; }
        .section-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 48px; }
        .section-title em { font-style: italic; font-family: 'Source Serif 4', serif; font-weight: 400; color: var(--crimson); }
        .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .feature-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 24px; transition: border-color 0.2s, transform 0.2s; }
        .feature-card:hover { border-color: var(--border-crimson); transform: translateY(-2px); }
        .feature-accent { width: 3px; height: 28px; border-radius: 2px; margin-bottom: 14px; }
        .feature-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .feature-card p { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--steel); line-height: 1.7; }

        .boundary-section { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto 80px; padding: 0 40px; }
        .boundary-card { background: var(--card); border: 1px solid var(--border-crimson); border-radius: 12px; padding: 48px; position: relative; overflow: hidden; }
        .boundary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--crimson), transparent); }
        .boundary-inner { max-width: 560px; }
        .boundary-card h2 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 10px; }
        .boundary-card h2 em { font-style: italic; font-family: 'Source Serif 4', serif; font-weight: 400; color: var(--crimson); }
        .boundary-card p { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--steel); line-height: 1.9; margin-bottom: 6px; }
        .boundary-line { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--amber); margin-top: 20px; letter-spacing: 0.02em; border-left: 2px solid var(--amber); padding-left: 14px; line-height: 1.7; }

        footer { position: relative; z-index: 1; border-top: 1px solid var(--border); padding: 24px 48px; max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .footer-left { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--steel); }
        .footer-left strong { color: var(--crimson); }
        .footer-right { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #1a2e42; }

        .receipt { position: relative; z-index: 1; text-align: center; padding: 32px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #1a2e42; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0; animation: fadeUp 1s 3.2s ease forwards; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; padding: 100px 24px 60px; text-align: center; }
          .hero-sub { max-width: 100%; }
          .cta-row { justify-content: center; }
          .stamp-col { order: -1; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .feature-grid { grid-template-columns: 1fr; }
          .stats-section, .features-section, .boundary-section { padding: 0 20px; }
          .boundary-card { padding: 32px 20px; }
          nav { padding: 16px 20px; }
          .nav-tag { display: none; }
          footer { padding: 20px; flex-direction: column; text-align: center; }
        }
      `}</style>

      <nav>
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="90" fill="none" stroke="#F5F1EB" strokeWidth="2"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="#F5F1EB" strokeWidth="0.8"/>
  <circle cx="100" cy="100" r="95" fill="none" stroke="#F5F1EB" strokeWidth="0.8" strokeDasharray="6 4"/>
  <path d="M 100,18 A 82,82 0 1,1 99.99,18 Z" fill="#9B111E" opacity="0.15"/>
  <circle cx="100" cy="100" r="78" fill="#0D1B2A"/>
  <text x="100" y="88" textAnchor="middle" fontFamily="Space Grotesk,sans-serif" fontWeight="700" fontSize="52" fill="#9B111E">AF</text>
  <circle cx="30" cy="100" r="2" fill="#C49A3C"/>
  <circle cx="170" cy="100" r="2" fill="#C49A3C"/>
</svg>
          <div className="logo-text">Audit<span>Forge</span></div>
        </div>
        <div className="nav-right">
          <span className="nav-tag">System of Structure</span>
          <div className="nav-badge">v0.2 Live</div>
          <button className="btn-signin" onClick={() => router.push("/coming-soon")}>Sign In</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">Governed Documentation · auditforge.dev</div>
          <h1>The audit package<br /><em>generates itself.</em></h1>
          <p className="hero-sub">
            AuditForge takes your control and risk data and produces <strong>governed audit deliverables</strong> — RCMs, MCLs, walkthroughs, and audit plans — in seconds from a live star schema.
            <br /><br />
            The auditor issues the opinion. AuditForge produces the evidence package.
          </p>
          <div className="cta-row">
            <a href="/" className="btn-guest">Enter as Guest →</a>
            <button className="btn-primary" onClick={() => router.push("/coming-soon")}>Sign In</button>
          </div>
          <div className="cta-hint">demo@auditforge.dev &nbsp;·&nbsp; DDLogistics!9*6</div>
          <div className="cta-sub">
            <a href="/llms.txt" className="btn-manifest">OperatorManifest →</a>
          </div>
        </div>
        <div className="stamp-col">
          <RadialStamp visible={visible} />
        </div>
      </section>

      {/* Receipt */}
      <div className="receipt">
        One operator &nbsp;·&nbsp; One session &nbsp;·&nbsp; Three council reviews &nbsp;·&nbsp; The forge is hot
      </div>

      {/* Ticker */}
      <div className="divider-strip">
        <div className="ticker-inner">
          {[
            { label: "Controls", val: "15 DDL CAE" },
            { label: "Risks", val: "17 mapped" },
            { label: "Processes", val: "18 active" },
            { label: "Frameworks", val: "COSO · SOX · COBIT" },
            { label: "Generators", val: "4 document types" },
            { label: "Schema", val: "Star — Fact_Control" },
          ].flatMap((item, i) => [
            <div key={`a${i}`} className="ticker-item">
              <span className="ticker-label">{item.label}</span>
              <span style={{ color: "#C49A3C", fontWeight: 600 }}>{item.val}</span>
            </div>,
            <div key={`d${i}`} className="ticker-dot" />,
            <div key={`b${i}`} className="ticker-item">
              <span className="ticker-label">{item.label}</span>
              <span style={{ color: "#C49A3C", fontWeight: 600 }}>{item.val}</span>
            </div>,
            <div key={`e${i}`} className="ticker-dot" />,
          ])}
        </div>
      </div>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num" style={{ color: "#B23531" }}>7</div>
            <div className="stat-label">document types generated from live data</div>
            <div className="stat-sub">RCM · MCL · 4 Walkthroughs · Audit Plan</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "#C49A3C" }}>9</div>
            <div className="stat-label">governance rules on every mutation</div>
            <div className="stat-sub">Silent Fix Prevention · AuditTrail · State Machine</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "#6B9DC2" }}>3</div>
            <div className="stat-label">council reviews. unanimous lock on analytics.</div>
            <div className="stat-sub">10 seats · CR-001 through CR-003</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "#4A9E6B" }}>2</div>
            <div className="stat-label">days from schema to production</div>
            <div className="stat-sub">CoherentVelocity · AcceptableArrogance</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-label">What It Generates</div>
        <div className="section-title">Structure in.<br /><em>Documents out.</em></div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-accent" style={{ background: f.color }} />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Boundary */}
      <section className="boundary-section">
        <div className="boundary-card">
          <div className="boundary-inner">
            <h2>A <em>System of Structure.</em><br />Not execution. Not opinion.</h2>
            <p>AuditForge defines what controls are. It does not test whether they work.</p>
            <p>It generates governed documentation. It does not issue audit opinions.</p>
            <p>It references evidence. It does not store it.</p>
            <div className="boundary-line">
              The auditor issues the opinion.<br />
              AuditForge produces the evidence package.<br />
              That line does not move.
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-left">
          <strong>AuditForge</strong> · v0.2 · auditforge.dev<br />
          <span style={{ fontSize: 10 }}>Dropdown Logistics — Chaos → Structured → Automated</span>
        </div>
        <div className="footer-right">
          A <a href="https://dropdownlogistics.com" target="_blank" rel="noopener noreferrer" style={{ color: "#263d55", textDecoration: "none" }}>Dropdown Logistics</a> product · <a href="/llms.txt" style={{ color: "#263d55", textDecoration: "none" }}>llms.txt</a>
        </div>
      </footer>
    </>
  );
}
