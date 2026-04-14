'use client';
import { Fragment, useState, useEffect } from 'react';

const C = {
  navy: "#0D1B2A",
  card: "#10202f",
  border: "rgba(245,241,235,0.07)",
  borderLight: "rgba(245,241,235,0.04)",
  cream: "#F5F1EB",
  steel: "#6B7B8D",
  copper: "#C49A3C",
  green: "#4A9E6B",
  crimson: "#B23531",
  blue: "#6B9DC2",
  violet: "#8a6cc9",
};

const SEVERITY = {
  MATERIAL_WEAKNESS:      { bg: "rgba(178,53,49,0.3)",  fg: C.crimson, label: "MATERIAL" },
  SIGNIFICANT_DEFICIENCY: { bg: "rgba(196,154,60,0.3)", fg: C.copper,  label: "SIGNIFICANT" },
  CONTROL_DEFICIENCY:     { bg: "rgba(107,157,194,0.3)",fg: C.blue,    label: "DEFICIENCY" },
  OBSERVATION:            { bg: "rgba(107,123,141,0.3)",fg: C.steel,   label: "OBSERVATION" },
};

const STATUS = {
  OPEN:           { bg: "rgba(178,53,49,0.25)",  fg: C.crimson },
  IN_REMEDIATION: { bg: "rgba(196,154,60,0.25)", fg: C.copper },
  CLOSED:         { bg: "rgba(74,158,107,0.25)", fg: C.green },
  ACCEPTED:       { bg: "rgba(107,123,141,0.25)",fg: C.steel },
};

function Badge({ bg, fg, children }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        background: bg,
        color: fg,
        padding: "3px 8px",
        borderRadius: 3,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function FindingsView({ companyId = "CO-DDL" }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/findings?companyId=${companyId}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (!cancelled) {
          setFindings(j.findings || []);
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
      <div style={{ padding: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>
        Loading findings…
      </div>
    );
  if (err)
    return (
      <div style={{ padding: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.crimson }}>
        Failed to load findings: {err}
      </div>
    );

  const total = findings.length;
  const byStatus = findings.reduce((m, f) => ((m[f.status] = (m[f.status] || 0) + 1), m), {});
  const bySeverity = findings.reduce((m, f) => ((m[f.severity] = (m[f.severity] || 0) + 1), m), {});

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(196,154,60,0.8)",
            marginBottom: 6,
          }}
        >
          Findings & Issues
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.cream }}>Audit Findings</div>
        <div style={{ fontSize: 13, color: "rgba(245,241,235,0.4)", marginTop: 4 }}>
          {total} finding{total === 1 ? "" : "s"} tracked. Click any row to expand.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Open", value: byStatus.OPEN || 0, color: C.crimson },
          { label: "In Remediation", value: byStatus.IN_REMEDIATION || 0, color: C.copper },
          { label: "Closed", value: byStatus.CLOSED || 0, color: C.green },
          { label: "Accepted", value: byStatus.ACCEPTED || 0, color: C.steel },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ width: 20, height: 2, background: s.color, borderRadius: 1, marginBottom: 8 }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Finding ID", "Title", "Severity", "Status", "Owner", "Target"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.cream,
                    background: C.navy,
                    borderBottom: `2px solid ${C.copper}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {findings.map((f, i) => {
              const sev = SEVERITY[f.severity] || SEVERITY.OBSERVATION;
              const sts = STATUS[f.status] || STATUS.OPEN;
              const isOpen = expanded === f.id;
              return (
                <Fragment key={f.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : f.id)}
                    style={{ background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent", cursor: "pointer" }}
                  >
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.copper, fontWeight: 700 }}>
                      {f.findingId}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream }}>
                      {f.title}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
                      <Badge bg={sev.bg} fg={sev.fg}>{sev.label}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
                      <Badge bg={sts.bg} fg={sts.fg}>{f.status.replace("_", " ")}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>
                      {f.owner}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>
                      {f.targetDate ? new Date(f.targetDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: "rgba(196,154,60,0.04)" }}>
                      <td colSpan={6} style={{ padding: "18px 24px", borderBottom: `1px solid ${C.borderLight}` }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
                          Description
                        </div>
                        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream, lineHeight: 1.6, marginBottom: 16 }}>
                          {f.description}
                        </div>

                        {f.managementResponse && (
                          <>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
                              Management Response
                            </div>
                            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: "rgba(245,241,235,0.8)", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>
                              {f.managementResponse}
                            </div>
                          </>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                          <div>
                            <div style={{ color: C.steel, marginBottom: 4 }}>ENGAGEMENT</div>
                            <div style={{ color: C.cream }}>{f.audit?.auditId || "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: C.steel, marginBottom: 4 }}>CONTROL</div>
                            <div style={{ color: C.cream }}>{f.control?.controlId || "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: C.steel, marginBottom: 4 }}>TARGET DATE</div>
                            <div style={{ color: C.cream }}>{f.targetDate ? new Date(f.targetDate).toLocaleDateString() : "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: C.steel, marginBottom: 4 }}>CLOSED DATE</div>
                            <div style={{ color: C.cream }}>{f.closedDate ? new Date(f.closedDate).toLocaleDateString() : "—"}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {findings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: "center", color: C.steel, fontSize: 12 }}>
                  No findings recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
