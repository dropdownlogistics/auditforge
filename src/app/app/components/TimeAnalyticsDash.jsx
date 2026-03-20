'use client';
import { useState, useEffect } from 'react';

const C = {
  card: "#10202f", border: "rgba(245,241,235,0.07)", borderLight: "rgba(245,241,235,0.04)",
  cream: "#F5F1EB", steel: "#6B7B8D", copper: "#C49A3C", green: "#4A9E6B",
  crimson: "#B23531", blue: "#6B9DC2", navy: "#0D1B2A",
};

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.cream }}>{value.toFixed(1)}h</span>
      </div>
      <div style={{ height: 5, background: "rgba(245,241,235,0.04)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function StatCell({ label, value, color, sub }) {
  return (
    <div style={{ background: C.card, padding: "16px", textAlign: "center" }}>
      <div style={{ width: 20, height: 2, background: color, borderRadius: 1, margin: "0 auto 8px" }} />
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: color, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel, letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function TimeAnalyticsDash() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/time-entries')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, padding: "16px 0" }}>
      Loading time data...
    </div>
  );

  const entries = data?.entries || [];

  if (entries.length === 0) return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 24 }}>⏱</div>
      <div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: C.cream, marginBottom: 4 }}>No time entries yet</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>Head to the Time tab to log your first hours.</div>
      </div>
    </div>
  );

  // Aggregations
  const summary = data.summary || {};
  const billablePct = summary.billablePct || 0;
  const goalMet = billablePct >= 75;

  // By component
  const byComponent = {};
  entries.forEach(e => { byComponent[e.component] = (byComponent[e.component] || 0) + e.hours; });
  const maxComponent = Math.max(...Object.values(byComponent));

  // By engagement
  const byEngagement = {};
  entries.forEach(e => {
    const name = e.engagement?.auditName || e.engagementId;
    byEngagement[name] = (byEngagement[name] || 0) + e.hours;
  });
  const topEngagements = Object.entries(byEngagement).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxEngagement = topEngagements[0]?.[1] || 1;

  // By auditor
  const byAuditor = {};
  entries.forEach(e => {
    const name = e.auditor?.auditorName || e.auditorId;
    byAuditor[name] = (byAuditor[name] || 0) + e.hours;
  });
  const topAuditors = Object.entries(byAuditor).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxAuditor = topAuditors[0]?.[1] || 1;

  // Monthly trend
  const byMonth = {};
  entries.forEach(e => { byMonth[e.monthTag] = (byMonth[e.monthTag] || 0) + e.hours; });
  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(...months.map(m => m[1]));

  const COMPONENT_COLORS = {
    Fieldwork: C.green, Planning: C.blue, Review: C.copper,
    Admin: C.steel, Training: "#8a6cc9",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Section label */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.copper, display: "flex", alignItems: "center", gap: 10 }}>
        Time Analytics
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(196,154,60,0.06)", borderRadius: 8, overflow: "hidden" }}>
        <StatCell label="Total Hours" value={summary.totalHours?.toFixed(1) || "0"} color={C.cream} />
        <StatCell label="Billable" value={summary.billableHours?.toFixed(1) || "0"} color={C.green} />
        <StatCell label="Non-Billable" value={summary.nonBillableHours?.toFixed(1) || "0"} color={C.copper} />
        <StatCell
          label="Billable %"
          value={`${billablePct}%`}
          color={goalMet ? C.green : C.crimson}
          sub={goalMet ? "GOAL MET" : "BELOW 75% GOAL"}
        />
      </div>

      {/* Three column breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* By Component */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 14 }}>BY COMPONENT</div>
          {Object.entries(byComponent).sort((a, b) => b[1] - a[1]).map(([comp, hrs]) => (
            <MiniBar key={comp} label={comp} value={hrs} max={maxComponent} color={COMPONENT_COLORS[comp] || C.blue} />
          ))}
        </div>

        {/* By Engagement */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 14 }}>BY ENGAGEMENT</div>
          {topEngagements.map(([name, hrs]) => (
            <MiniBar key={name} label={name.length > 28 ? name.slice(0, 28) + "…" : name} value={hrs} max={maxEngagement} color={C.blue} />
          ))}
        </div>

        {/* By Auditor */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 14 }}>BY AUDITOR</div>
          {topAuditors.map(([name, hrs]) => (
            <MiniBar key={name} label={name} value={hrs} max={maxAuditor} color={C.copper} />
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      {months.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginBottom: 14 }}>MONTHLY TREND</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {months.map(([month, hrs]) => {
              const pct = maxMonth > 0 ? (hrs / maxMonth) * 100 : 0;
              return (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel }}>{hrs.toFixed(0)}h</div>
                  <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, minHeight: 4, background: C.green, borderRadius: "3px 3px 0 0", transition: "height 0.8s ease" }} />
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: C.steel, textAlign: "center" }}>{month.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
