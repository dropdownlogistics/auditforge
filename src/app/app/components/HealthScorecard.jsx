'use client';
import { useState, useEffect } from 'react';

const C = {
  card: "#10202f",
  border: "rgba(245,241,235,0.07)",
  cream: "#F5F1EB",
  steel: "#6B7B8D",
  copper: "#C49A3C",
  green: "#4A9E6B",
  crimson: "#B23531",
  blue: "#6B9DC2",
};

const fmtUSD = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);

function scoreColor(score) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.copper;
  return C.crimson;
}

function scoreLabel(score) {
  if (score >= 80) return "HEALTHY";
  if (score >= 60) return "MONITOR";
  return "AT RISK";
}

function Row({ label, value, sub, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "6px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: C.steel,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: color || C.cream, fontWeight: 700 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function PointsBar({ points, color }) {
  const pct = (points / 25) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(245,241,235,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color, fontWeight: 700, minWidth: 28, textAlign: "right" }}>
        {points}/25
      </div>
    </div>
  );
}

function Panel({ title, color, children, points }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color,
          }}
        >
          {title}
        </div>
      </div>
      {children}
      <PointsBar points={points} color={color} />
    </div>
  );
}

export default function HealthScorecard({ auditId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/audits/${auditId}/health`);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (!cancelled) {
          setData(j);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  if (loading)
    return (
      <div style={{ padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
        Scoring…
      </div>
    );
  if (err)
    return (
      <div style={{ padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.crimson }}>
        Health score unavailable: {err}
      </div>
    );

  const { score, components } = data;
  const sc = scoreColor(score);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: `3px solid ${sc}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: C.card,
          }}
        >
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: sc, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: sc, opacity: 0.8 }}>SCORE</div>
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.08em" }}>
            HEALTH SCORECARD
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: sc, marginTop: 2 }}>
            {scoreLabel(score)}
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.steel, marginTop: 2 }}>
            Composite of hours, controls, billing, and timeline.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Panel title="Hours" color={C.blue} points={components.hours.points}>
          <Row label="Budget" value={`${components.hours.budgetHours}h`} />
          <Row label="Actual" value={`${components.hours.actualHours}h`} />
          <Row label="Utilization" value={fmtPct(components.hours.utilization)} />
        </Panel>

        <Panel title="Controls" color={C.green} points={components.controls.points}>
          <Row label="In Scope" value={components.controls.inScope} />
          <Row label="Coverage" value={fmtPct(components.controls.coverage)} sub={`${components.controls.approved} approved`} />
          <Row label="Effective" value={fmtPct(components.controls.effectivenessRate)} />
        </Panel>

        <Panel title="Billing" color={C.copper} points={components.billing.points}>
          <Row label="Budget" value={fmtUSD(components.billing.dollarBudget)} />
          <Row label="Billed" value={fmtUSD(components.billing.billed)} />
          <Row label="Realization" value={fmtPct(components.billing.realization)} />
        </Panel>

        <Panel title="Timeline" color={C.crimson} points={components.timeline.points}>
          <Row label="End" value={components.timeline.endDate ? new Date(components.timeline.endDate).toLocaleDateString() : "—"} />
          <Row
            label="Days Left"
            value={components.timeline.daysRemaining != null ? `${components.timeline.daysRemaining}d` : "—"}
            color={
              components.timeline.daysRemaining == null
                ? C.steel
                : components.timeline.daysRemaining < 0
                ? C.crimson
                : components.timeline.daysRemaining < 14
                ? C.copper
                : C.cream
            }
          />
          <Row label="Team" value={`${components.team.headcount}`} sub={`${components.team.tokenCoverage} skills`} />
        </Panel>
      </div>
    </div>
  );
}
