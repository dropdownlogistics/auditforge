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
  green: "#22C55E",
  greenSoft: "#4A9E6B",
  crimson: "#B23531",
  blue: "#6B9DC2",
  violet: "#8a6cc9",
};

const fmtUSD = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);

function StatCell({ label, value, color, sub }) {
  return (
    <div style={{ background: C.card, padding: "16px", textAlign: "center" }}>
      <div style={{ width: 20, height: 2, background: color, borderRadius: 1, margin: "0 auto 8px" }} />
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color, opacity: 0.7, marginTop: 2 }}>{sub}</div>
      )}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: C.steel,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginTop: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Badge({ children, bg, fg }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        background: bg,
        color: fg || C.navy,
        padding: "3px 8px",
        borderRadius: 3,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

const INVOICE_BADGE = {
  DRAFT: { bg: "rgba(107,123,141,0.25)", fg: C.cream },
  SENT: { bg: "rgba(107,157,194,0.25)", fg: C.blue },
  PAID: { bg: "rgba(34,197,94,0.2)", fg: C.green },
  OVERDUE: { bg: "rgba(178,53,49,0.25)", fg: C.crimson },
  WRITTEN_OFF: { bg: "rgba(138,108,201,0.2)", fg: C.violet },
};

const AUDIT_BADGE = {
  PLANNING: { bg: "rgba(107,157,194,0.25)", fg: C.blue },
  FIELDWORK: { bg: "rgba(196,154,60,0.25)", fg: C.copper },
  REPORTING: { bg: "rgba(138,108,201,0.25)", fg: C.violet },
  COMPLETED: { bg: "rgba(34,197,94,0.2)", fg: C.green },
  CANCELLED: { bg: "rgba(107,123,141,0.25)", fg: C.steel },
};

function SectionHeader({ children }) {
  return (
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
        marginTop: 8,
      }}
    >
      {children}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "16px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function BillingDash({ companyId = "CO-DDL" }) {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showAllAuditors, setShowAllAuditors] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, iRes] = await Promise.all([
          fetch(`/api/billing/summary?companyId=${companyId}`),
          fetch(`/api/billing/invoices?companyId=${companyId}`),
        ]);
        if (!sRes.ok) throw new Error(`summary ${sRes.status}`);
        if (!iRes.ok) throw new Error(`invoices ${iRes.status}`);
        const s = await sRes.json();
        const i = await iRes.json();
        if (!cancelled) {
          setSummary(s);
          setInvoices(i.invoices || []);
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
      <div style={{ padding: "32px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>
        Loading billing data…
      </div>
    );
  if (err)
    return (
      <div style={{ padding: "32px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.crimson }}>
        Failed to load billing: {err}
      </div>
    );

  const { kpi, revenueByEngagement, revenueByAuditor, arAging } = summary;
  const topAuditors = showAllAuditors ? revenueByAuditor : revenueByAuditor.slice(0, 10);
  const agingMax = Math.max(arAging.current, arAging.d30, arAging.d60, arAging.d90, 1);

  return (
    <div style={{ padding: "32px" }}>
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
          Billing & Revenue
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.cream }}>Financial Dashboard</div>
        <div style={{ fontSize: 13, color: "rgba(245,241,235,0.4)", marginTop: 4 }}>
          Realization, collections, and revenue across the engagement portfolio.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* SECTION 1 — KPI Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 1,
            background: "rgba(196,154,60,0.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <StatCell label="Billed YTD" value={fmtUSD(kpi.totalBilled)} color={C.copper} />
          <StatCell label="Collected" value={fmtUSD(kpi.totalCollected)} color={C.green} />
          <StatCell label="Outstanding AR" value={fmtUSD(kpi.outstandingAR)} color={C.copper} />
          <StatCell
            label="Realization"
            value={fmtPct(kpi.realizationRate)}
            color={kpi.realizationRate >= 0.85 ? C.green : C.crimson}
            sub={kpi.realizationRate >= 0.85 ? "ON TARGET" : "BELOW 85%"}
          />
          <StatCell
            label="Collection"
            value={fmtPct(kpi.collectionRate)}
            color={kpi.collectionRate >= 0.9 ? C.green : C.copper}
          />
        </div>

        {/* SECTION 2 — Revenue by Engagement */}
        <SectionHeader>Revenue by Engagement</SectionHeader>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Engagement", "Budget $", "Billed $", "Collected $", "Realization %", "Status"].map((h) => (
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
              {revenueByEngagement.map((e, i) => {
                const real = e.realization;
                const realColor = real >= 0.85 ? C.green : real >= 0.5 ? C.copper : C.crimson;
                const badge = AUDIT_BADGE[e.status] || AUDIT_BADGE.PLANNING;
                return (
                  <tr
                    key={e.auditId}
                    style={{ background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${C.borderLight}`,
                        fontFamily: "'Source Serif 4', serif",
                        fontSize: 13,
                        color: C.cream,
                      }}
                    >
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                        {e.auditId}
                      </div>
                      {e.auditName || <span style={{ color: C.steel }}>—</span>}
                    </td>
                    <td style={cellStyle()}>{fmtUSD(e.budget)}</td>
                    <td style={cellStyle(C.copper)}>{fmtUSD(e.billed)}</td>
                    <td style={cellStyle(C.green)}>{fmtUSD(e.collected)}</td>
                    <td style={cellStyle(realColor)}>{fmtPct(real)}</td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
                      {e.status ? <Badge bg={badge.bg} fg={badge.fg}>{e.status}</Badge> : <span style={{ color: C.steel }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* SECTION 3 — Revenue by Auditor */}
        <SectionHeader>Revenue by Auditor</SectionHeader>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Auditor", "Role", "Hours", "Rate", "Revenue"].map((h) => (
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
              {topAuditors.map((a, i) => (
                <tr key={a.auditorId} style={{ background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent" }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${C.borderLight}`,
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: 13,
                      color: C.cream,
                    }}
                  >
                    {a.auditorName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${C.borderLight}`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: C.steel,
                    }}
                  >
                    {a.role}
                  </td>
                  <td style={cellStyle()}>{a.hours.toFixed(1)}h</td>
                  <td style={cellStyle()}>{fmtUSD(a.rate)}</td>
                  <td style={cellStyle(C.copper)}>{fmtUSD(a.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {revenueByAuditor.length > 10 && (
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.borderLight}`, textAlign: "center" }}>
              <button
                onClick={() => setShowAllAuditors(!showAllAuditors)}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.copper,
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {showAllAuditors ? "Show top 10" : `Show all ${revenueByAuditor.length}`}
              </button>
            </div>
          )}
        </Card>

        {/* SECTION 4 — AR Aging */}
        <SectionHeader>AR Aging</SectionHeader>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { label: "Current", value: arAging.current, color: C.green },
              { label: "1–30 days", value: arAging.d30, color: C.copper },
              { label: "31–60 days", value: arAging.d60, color: C.copper },
              { label: "61–90+ days", value: arAging.d90, color: C.crimson },
            ].map((b) => {
              const pct = agingMax > 0 ? (b.value / agingMax) * 100 : 0;
              return (
                <div key={b.label}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: C.steel,
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: b.color,
                      marginBottom: 8,
                    }}
                  >
                    {fmtUSD(b.value)}
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "rgba(245,241,235,0.04)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: b.color,
                        borderRadius: 3,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* SECTION 5 — Invoice List */}
        <SectionHeader>Invoices</SectionHeader>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Invoice", "Engagement", "Amount", "Status", "Collected", "Invoice Date", "Due"].map((h) => (
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
              {invoices.map((inv, i) => {
                const badge = INVOICE_BADGE[inv.status] || INVOICE_BADGE.DRAFT;
                const paid = (inv.arEntries || []).reduce((s, ar) => s + (ar.amountPaid || 0), 0);
                const pctPaid = inv.totalAmount > 0 ? (paid / inv.totalAmount) * 100 : 0;
                const isOpen = expandedInvoice === inv.id;
                return (
                  <Fragment key={inv.id}>
                    <tr
                      onClick={() => setExpandedInvoice(isOpen ? null : inv.id)}
                      style={{ background: i % 2 ? "rgba(245,241,235,0.02)" : "transparent", cursor: "pointer" }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid ${C.borderLight}`,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: C.cream,
                          fontWeight: 600,
                        }}
                      >
                        {inv.invoiceId}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid ${C.borderLight}`,
                          fontFamily: "'Source Serif 4', serif",
                          fontSize: 12,
                          color: C.cream,
                        }}
                      >
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>
                          {inv.audit?.auditId}
                        </div>
                        {inv.audit?.auditName || "—"}
                      </td>
                      <td style={cellStyle(C.copper)}>{fmtUSD(inv.totalAmount)}</td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
                        <Badge bg={badge.bg} fg={badge.fg}>{inv.status}</Badge>
                      </td>
                      <td style={cellStyle(pctPaid > 0 ? C.green : C.steel)}>
                        {fmtUSD(paid)} <span style={{ color: C.steel, fontSize: 10 }}>({pctPaid.toFixed(0)}%)</span>
                      </td>
                      <td style={cellStyle()}>
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={cellStyle()}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ background: "rgba(196,154,60,0.05)" }}>
                        <td colSpan={7} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderLight}` }}>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              color: C.steel,
                              marginBottom: 8,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            Billing Detail
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontSize: 12, color: C.cream }}>
                            <div>
                              <div style={{ fontSize: 9, color: C.steel, marginBottom: 4 }}>Billed Hours</div>
                              {inv.billedHours?.toFixed(1)}h
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: C.steel, marginBottom: 4 }}>Blended Rate</div>
                              {fmtUSD(inv.billingRate)}/hr
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: C.steel, marginBottom: 4 }}>Currency</div>
                              {inv.currency}
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: C.steel, marginBottom: 4 }}>AR Status</div>
                              {(inv.arEntries || []).map((ar) => ar.status).join(", ") || "—"}
                            </div>
                          </div>
                          {inv.notes && (
                            <div
                              style={{
                                marginTop: 12,
                                fontSize: 11,
                                color: "rgba(245,241,235,0.6)",
                                fontStyle: "italic",
                                fontFamily: "'Source Serif 4', serif",
                              }}
                            >
                              {inv.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: C.steel, fontSize: 12 }}>
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* SECTION 6 — Realization / Write-up-down */}
        <SectionHeader>Realization by Engagement</SectionHeader>
        <Card>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: C.steel,
              marginBottom: 12,
            }}
          >
            Budget ${"-> "}Billed ${"-> "}Collected. Engagements below 85% realization flagged crimson.
          </div>
          {revenueByEngagement.map((e) => {
            const flagged = e.budget > 0 && e.realization < 0.85;
            const maxBar = Math.max(e.budget, e.billed, e.collected, 1);
            return (
              <div key={e.auditId + "-real"} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cream }}>
                    {e.auditId}{" "}
                    <span style={{ color: C.steel }}>
                      · {e.auditName || "—"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: flagged ? C.crimson : C.green,
                    }}
                  >
                    {fmtPct(e.realization)}
                    {flagged && <span style={{ marginLeft: 8, fontSize: 9 }}>⚠ BELOW 85%</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <RealizationBar label="Budget" value={e.budget} max={maxBar} color={C.steel} />
                  <RealizationBar label="Billed" value={e.billed} max={maxBar} color={C.copper} />
                  <RealizationBar label="Collected" value={e.collected} max={maxBar} color={C.green} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function cellStyle(color) {
  return {
    padding: "12px 16px",
    borderBottom: `1px solid ${C.borderLight}`,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: color || C.cream,
  };
}

function RealizationBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 70,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: C.steel,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 8, background: "rgba(245,241,235,0.04)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <div
        style={{
          width: 100,
          textAlign: "right",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: C.cream,
        }}
      >
        {fmtUSD(value)}
      </div>
    </div>
  );
}
