content = open('src/app/app/page.js', encoding='utf-8').read()

audit_analytics = '''
// ── Audit Program Analytics ──────────────────────────────────────────────────
function AuditProgramAnalytics({ audits }) {
  if (!audits || audits.length === 0) return null;

  // Derived stats
  const totalBudgetHours = audits.reduce((s, a) => s + a.team.reduce((t, m) => t + (m.budgetHours || 0), 0), 0);
  const totalControls = audits.reduce((s, a) => s + (a.controlScope?.filter(c => c.inScope).length || 0), 0);
  const totalTeamAssignments = audits.reduce((s, a) => s + (a.team?.length || 0), 0);
  const statusCounts = audits.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  // By lead
  const byLead = {};
  audits.forEach(a => {
    const lead = a.leadAuditor?.auditorName || 'Unknown';
    if (!byLead[lead]) byLead[lead] = { audits: 0, hours: 0, controls: 0 };
    byLead[lead].audits++;
    byLead[lead].hours += a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);
    byLead[lead].controls += a.controlScope?.filter(c => c.inScope).length || 0;
  });

  // Timeline — months covered
  const now = new Date('2025-01-01');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const STATUS_COLOR = {
    PLANNING: '#C49A3C', FIELDWORK: '#6B9DC2', REPORTING: '#8a6cc9',
    COMPLETED: '#4A9E6B', CANCELLED: '#B23531',
  };

  return (
    <div style={{ padding: "0 32px 32px" }}>

      {/* Stat strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 1, background: "rgba(245,241,235,0.07)",
        borderRadius: 10, overflow: "hidden", marginBottom: 24,
      }}>
        {[
          { value: audits.length, label: "ENGAGEMENTS", sub: Object.entries(statusCounts).map(([k,v]) => v + " " + k.toLowerCase()).join(" · "), color: "#C49A3C" },
          { value: Math.round(totalBudgetHours).toLocaleString() + "h", label: "TOTAL BUDGET", sub: Math.round(totalBudgetHours / audits.length) + "h avg per engagement", color: "#6B9DC2" },
          { value: totalControls, label: "CONTROLS IN SCOPE", sub: Math.round(totalControls / audits.length) + " avg per engagement", color: "#B23531" },
          { value: totalTeamAssignments, label: "TEAM ASSIGNMENTS", sub: Math.round(totalTeamAssignments / audits.length) + " avg team size", color: "#4A9E6B" },
        ].map(s => (
          <div key={s.label} style={{ background: "#10202f", padding: "20px 24px" }}>
            <div style={{ width: 28, height: 2, background: s.color, borderRadius: 1, marginBottom: 10 }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: "#F5F1EB", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#F5F1EB", letterSpacing: "0.08em", margin: "6px 0 3px", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column: Timeline + By Lead */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Timeline */}
        <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>ENGAGEMENT TIMELINE — FY2025</div>
          <div style={{ position: "relative" }}>
            {/* Month labels */}
            <div style={{ display: "flex", marginBottom: 8 }}>
              {months.map(m => (
                <div key={m} style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080", textAlign: "center" }}>{m}</div>
              ))}
            </div>
            {/* Engagement bars */}
            {audits.map((audit, i) => {
              const start = audit.startDate ? new Date(audit.startDate) : null;
              const end = audit.endDate ? new Date(audit.endDate) : null;
              if (!start || !end) return null;
              const startMonth = start.getMonth();
              const endMonth = end.getMonth();
              const spanMonths = endMonth - startMonth + 1;
              const color = STATUS_COLOR[audit.status] || '#C49A3C';
              return (
                <div key={audit.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                  <div style={{ flex: 1, position: "relative", height: 24 }}>
                    <div style={{ position: "absolute", height: "100%", background: "rgba(245,241,235,0.03)", borderRadius: 4, left: 0, right: 0 }} />
                    <div style={{
                      position: "absolute",
                      left: (startMonth / 12 * 100) + "%",
                      width: (spanMonths / 12 * 100) + "%",
                      height: "100%",
                      background: color,
                      borderRadius: 4,
                      opacity: 0.85,
                      display: "flex", alignItems: "center", paddingLeft: 8,
                      overflow: "hidden",
                    }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#0D1B2A", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {audit.auditId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {Object.entries(STATUS_COLOR).map(([status, color]) => (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080" }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By Lead */}
        <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>BY ENGAGEMENT LEAD</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,241,235,0.07)" }}>
                {["Lead", "Audits", "Budget Hours", "Controls"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byLead).sort((a, b) => b[1].hours - a[1].hours).map(([lead, data]) => (
                <tr key={lead} style={{ borderBottom: "1px solid rgba(245,241,235,0.04)" }}>
                  <td style={{ padding: "10px 10px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "#F5F1EB" }}>{lead}</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#C49A3C", fontWeight: 700 }}>{data.audits}</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B9DC2" }}>{Math.round(data.hours)}h</td>
                  <td style={{ padding: "10px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B23531" }}>{data.controls}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Budget distribution bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D", marginBottom: 8 }}>BUDGET DISTRIBUTION</div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
              {audits.map((a, i) => {
                const hours = a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);
                const pct = (hours / totalBudgetHours * 100).toFixed(1);
                const colors = ["#B23531","#C49A3C","#6B9DC2","#4A9E6B"];
                return (
                  <div key={a.id} title={a.auditId + ": " + hours + "h (" + pct + "%)"} style={{
                    width: pct + "%", background: colors[i % colors.length], borderRadius: 2,
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {audits.map((a, i) => {
                const hours = a.team.reduce((t, m) => t + (m.budgetHours || 0), 0);
                const colors = ["#B23531","#C49A3C","#6B9DC2","#4A9E6B"];
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 1, background: colors[i % colors.length] }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#4a6080" }}>{a.auditId.replace("AUD-2025-","")}: {Math.round(hours)}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Process coverage */}
      <div style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.07)", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em", marginBottom: 16 }}>PROCESS AREA COVERAGE ACROSS ENGAGEMENTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {(() => {
            const areaMap = {};
            audits.forEach(a => {
              (a.controlScope || []).filter(s => s.inScope).forEach(s => {
                const area = s.control?.process?.processArea;
                if (!area) return;
                if (!areaMap[area]) areaMap[area] = { count: 0, audits: new Set() };
                areaMap[area].count++;
                areaMap[area].audits.add(a.auditId);
              });
            });
            return Object.entries(areaMap).sort((a, b) => b[1].count - a[1].count).map(([area, data]) => (
              <div key={area} style={{
                background: "rgba(245,241,235,0.03)", borderRadius: 6, padding: "10px 14px",
                borderLeft: "2px solid " + (data.audits.size > 1 ? "#4A9E6B" : "#C49A3C"),
              }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "#F5F1EB", marginBottom: 3 }}>{area}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6B7B8D" }}>
                  {data.count} controls · {data.audits.size} engagement{data.audits.size > 1 ? "s" : ""}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

'''

# Inject AuditProgramAnalytics before AuditsView
old_anchor = 'function AuditsView({ audits, controls, auditors, loading, onRefresh }) {'
content = content.replace(old_anchor, audit_analytics + old_anchor)
print('AuditProgramAnalytics added:', 'AuditProgramAnalytics' in content)

# Inject analytics component into AuditsView, after the Header/wizard block
old_header_block = '''      <Header title="Audit Engagements" meta={`${audits.length} audit(s) \u00b7 v0.4 Planning Layer`}>
        <button onClick={() => setShowWizard(true)} style={{
          padding: "8px 18px", background: C.crimson, color: C.cream,
          border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>+ New Audit</button>
      </Header>'''

new_header_block = '''      <Header title="Audit Engagements" meta={`${audits.length} audit(s) \u00b7 v0.4 Planning Layer`}>
        <button onClick={() => setShowWizard(true)} style={{
          padding: "8px 18px", background: C.crimson, color: C.cream,
          border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>+ New Audit</button>
      </Header>
      <AuditProgramAnalytics audits={audits} />
      <div style={{ padding: "0 32px", marginBottom: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em" }}>ENGAGEMENT DETAIL</div>
      </div>'''

content = content.replace(old_header_block, new_header_block)
print('Analytics injected into AuditsView:', 'AuditProgramAnalytics audits' in content)

open('src/app/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
