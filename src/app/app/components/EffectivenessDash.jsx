'use client';
import { useState, useEffect } from 'react';

const C = {
  card: "#10202f",
  border: "rgba(245,241,235,0.07)",
  borderLight: "rgba(245,241,235,0.04)",
  cream: "#F5F1EB",
  steel: "#6B7B8D",
  copper: "#C49A3C",
  green: "#4A9E6B",
  crimson: "#B23531",
  navy: "#0D1B2A",
};

const COLOR = {
  EFFECTIVE: C.green,
  PARTIALLY_EFFECTIVE: C.copper,
  INEFFECTIVE: C.crimson,
  NOT_TESTED: C.steel,
};

const ORDER = ["EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE", "NOT_TESTED"];

function StackedBar({ counts, total }) {
  return (
    <div style={{ display: "flex", width: "100%", height: 20, borderRadius: 4, overflow: "hidden", background: "rgba(245,241,235,0.04)" }}>
      {ORDER.map((k) => {
        const n = counts[k] || 0;
        if (!n) return null;
        const pct = total > 0 ? (n / total) * 100 : 0;
        return (
          <div
            key={k}
            title={`${k}: ${n}`}
            style={{
              width: `${pct}%`,
              background: COLOR[k],
              transition: "width 0.8s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function Legend({ counts, total }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      {ORDER.map((k) => {
        const n = counts[k] || 0;
        const pct = total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLOR[k] }} />
            <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.03em" }}>
              {k.replace(/_/g, " ")}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream, fontWeight: 700 }}>
              {n} <span style={{ color: C.steel, fontWeight: 400 }}>({pct}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EffectivenessDash({ companyId = "CO-DDL" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/controls/effectiveness-summary?companyId=${companyId}`);
        if (!r.ok) throw new Error(`${r.status}`);
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
  }, [companyId]);

  if (loading)
    return (
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, padding: 16 }}>
        Loading effectiveness…
      </div>
    );
  if (err)
    return (
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.crimson, padding: 16 }}>
        Failed to load effectiveness: {err}
      </div>
    );

  const { design, operating, total, dualIneffective, dualIneffectiveCount } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.copper,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        Control Effectiveness
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>n = {total}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 22px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.08em", marginBottom: 14 }}>
            DESIGN EFFECTIVENESS
          </div>
          <StackedBar counts={design} total={total} />
          <Legend counts={design} total={total} />
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 22px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.08em", marginBottom: 14 }}>
            OPERATING EFFECTIVENESS
          </div>
          <StackedBar counts={operating} total={total} />
          <Legend counts={operating} total={total} />
        </div>
      </div>

      {/* Dual-ineffective flag card */}
      <div
        style={{
          background: dualIneffectiveCount > 0 ? "rgba(178,53,49,0.08)" : C.card,
          border: `1px solid ${dualIneffectiveCount > 0 ? "rgba(178,53,49,0.35)" : C.border}`,
          borderRadius: 8,
          padding: "18px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dualIneffectiveCount > 0 ? 12 : 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dualIneffectiveCount > 0 ? C.crimson : C.steel, letterSpacing: "0.08em", flex: 1 }}>
            DUAL-INEFFECTIVE CONTROLS
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: dualIneffectiveCount > 0 ? C.crimson : C.green }}>
            {dualIneffectiveCount}
          </div>
        </div>
        {dualIneffectiveCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dualIneffective.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "6px 10px",
                  background: "rgba(178,53,49,0.05)",
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: C.cream,
                }}
              >
                <span style={{ color: C.crimson, fontWeight: 700, minWidth: 90 }}>{c.controlId}</span>
                <span style={{ color: C.steel, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>
        )}
        {dualIneffectiveCount === 0 && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, marginTop: 6 }}>
            No controls failed both design and operating tests.
          </div>
        )}
      </div>

      {/* Trend placeholder */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 22px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.08em", marginBottom: 14 }}>
          EFFECTIVENESS TREND — QUARTERLY
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, opacity: 0.35 }}>
          {["Q1", "Q2", "Q3", "Q4"].map((q, i) => (
            <div key={q} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>—</div>
              <div style={{ width: "100%", height: 4, background: C.steel, borderRadius: 2 }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>{q}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginTop: 10, fontStyle: "italic" }}>
          Trend data populates after next quarter-end. Placeholder for future periods.
        </div>
      </div>
    </div>
  );
}
