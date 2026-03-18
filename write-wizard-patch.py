content = open('src/app/app/page.js', encoding='utf-8').read()

wizard = '''
// ── Create Audit Wizard ──────────────────────────────────────────────────────
function CreateAuditWizard({ controls, auditors, onClose, onCreated }) {
  const STEPS = ["Details", "Controls", "Team", "Review"];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 — Details
  const [auditId, setAuditId] = useState("AUD-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3));
  const [auditName, setAuditName] = useState("");
  const [leadAuditorId, setLeadAuditorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scope, setScope] = useState("");
  const [methodology, setMethodology] = useState("");

  // Step 2 — Controls
  const processAreas = [...new Set(controls.map(c => c.process?.processArea).filter(Boolean))].sort();
  const [selectedControls, setSelectedControls] = useState(new Set());
  const [expandedAreas, setExpandedAreas] = useState(new Set());

  const toggleArea = (area) => {
    const areaControls = controls.filter(c => c.process?.processArea === area);
    const allSelected = areaControls.every(c => selectedControls.has(c.id));
    const next = new Set(selectedControls);
    areaControls.forEach(c => allSelected ? next.delete(c.id) : next.add(c.id));
    setSelectedControls(next);
  };

  const toggleControl = (id) => {
    const next = new Set(selectedControls);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedControls(next);
  };

  // Step 3 — Team
  const [teamMembers, setTeamMembers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberAuditorId, setMemberAuditorId] = useState("");
  const [memberRole, setMemberRole] = useState("STAFF");
  const [memberPhase, setMemberPhase] = useState("ALL");
  const [memberHours, setMemberHours] = useState("");

  const addMember = () => {
    if (!memberAuditorId) return;
    const auditor = auditors.find(a => a.id === memberAuditorId || a.auditorId === memberAuditorId);
    if (!auditor) return;
    setTeamMembers(prev => [...prev.filter(m => m.auditorId !== auditor.auditorId), {
      auditorId: auditor.auditorId,
      auditorName: auditor.auditorName,
      role: auditor.role,
      teamRole: memberRole,
      assignedPhase: memberPhase,
      budgetHours: memberHours ? parseFloat(memberHours) : null,
    }]);
    setMemberAuditorId("");
    setMemberHours("");
    setAddingMember(false);
  };

  const removeMember = (auditorId) => {
    setTeamMembers(prev => prev.filter(m => m.auditorId !== auditorId));
  };

  // Submit
  const handleCreate = async () => {
    if (!auditName || !auditId) { setError("Audit ID and name are required"); return; }
    if (selectedControls.size === 0) { setError("Select at least one control"); return; }
    setSaving(true);
    setError(null);
    try {
      // 1. Create audit
      const auditRes = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "CO-DDL",
          auditId,
          auditName,
          auditType: "INTERNAL",
          leadAuditorId: leadAuditorId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          scope: scope || undefined,
          methodology: methodology || undefined,
        }),
      });
      const auditData = await auditRes.json();
      if (!auditRes.ok) throw new Error(auditData.error || "Failed to create audit");

      // 2. Scope controls
      if (selectedControls.size > 0) {
        await fetch(`/api/audits/${auditData.id}/scope`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            controlIds: [...selectedControls],
            scopeDecision: "IN_SCOPE",
          }),
        });
      }

      // 3. Assign team
      if (teamMembers.length > 0) {
        await fetch(`/api/audits/${auditData.id}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: teamMembers }),
        });
      }

      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return auditName.trim().length > 0 && auditId.trim().length > 0;
    if (step === 1) return selectedControls.size > 0;
    return true;
  };

  const ROLE_COLORS = {
    ENGAGEMENT_LEAD: C.crimson, DIRECTOR: C.crimson, MANAGER: C.copper,
    SENIOR: C.blue, STAFF: "#4A9E6B"
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, width: "100%", maxWidth: 760,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream }}>
              New Audit
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginTop: 2 }}>
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.steel, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", padding: "12px 28px", gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: i < step ? C.green : i === step ? C.copper : "rgba(245,241,235,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                color: i <= step ? C.navy : C.steel,
              }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: i === step ? C.cream : C.steel }}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: C.border, marginLeft: 2 }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* STEP 1 — Details */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>AUDIT ID *</label>
                  <input value={auditId} onChange={e => setAuditId(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>LEAD AUDITOR</label>
                  <select value={leadAuditorId} onChange={e => setLeadAuditorId(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, boxSizing: "border-box" }}>
                    <option value="">Select lead auditor...</option>
                    {auditors.filter(a => ["DIRECTOR", "MANAGER"].includes(a.role)).map(a => (
                      <option key={a.id} value={a.auditorId}>{a.auditorName} ({a.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>AUDIT NAME *</label>
                <input value={auditName} onChange={e => setAuditName(e.target.value)}
                  placeholder="e.g. Technology and Infrastructure Review — FY2025"
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>START DATE</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>END DATE</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>SCOPE DESCRIPTION</label>
                <textarea value={scope} onChange={e => setScope(e.target.value)} rows={3}
                  placeholder="What is being reviewed and why..."
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Source Serif 4', serif", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, display: "block", marginBottom: 6 }}>METHODOLOGY</label>
                <textarea value={methodology} onChange={e => setMethodology(e.target.value)} rows={3}
                  placeholder="Audit approach and key focus areas..."
                  style={{ width: "100%", background: C.navy, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.cream, fontFamily: "'Source Serif 4', serif", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {/* STEP 2 — Controls */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginBottom: 16 }}>
                {selectedControls.size} of {controls.length} controls selected
              </div>
              {processAreas.map(area => {
                const areaControls = controls.filter(c => c.process?.processArea === area);
                const allSelected = areaControls.every(c => selectedControls.has(c.id));
                const someSelected = areaControls.some(c => selectedControls.has(c.id));
                const isExpanded = expandedAreas.has(area);
                return (
                  <div key={area} style={{ marginBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    {/* Area header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      background: allSelected ? "rgba(196,154,60,0.08)" : someSelected ? "rgba(196,154,60,0.04)" : C.navy,
                      cursor: "pointer",
                    }}>
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => toggleArea(area)}
                        style={{ accentColor: C.copper, width: 14, height: 14, cursor: "pointer" }} />
                      <div onClick={() => setExpandedAreas(prev => {
                        const next = new Set(prev);
                        next.has(area) ? next.delete(area) : next.add(area);
                        return next;
                      })} style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.cream }}>{area}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                          {areaControls.filter(c => selectedControls.has(c.id)).length}/{areaControls.length} {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                    {/* Controls list */}
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${C.border}` }}>
                        {areaControls.map(ctrl => (
                          <div key={ctrl.id} onClick={() => toggleControl(ctrl.id)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "9px 16px 9px 32px",
                            borderBottom: `1px solid rgba(245,241,235,0.04)`,
                            background: selectedControls.has(ctrl.id) ? "rgba(196,154,60,0.04)" : "transparent",
                            cursor: "pointer",
                          }}>
                            <input type="checkbox" checked={selectedControls.has(ctrl.id)}
                              onChange={() => toggleControl(ctrl.id)}
                              style={{ accentColor: C.copper, cursor: "pointer" }} />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: C.copper, minWidth: 120 }}>{ctrl.controlId}</span>
                            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, flex: 1 }}>{ctrl.description?.substring(0, 80)}...</span>
                            {ctrl.keyControl && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.green }}>KEY</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3 — Team */}
          {step === 2 && (
            <div>
              {/* Team list */}
              {teamMembers.length > 0 && (
                <div style={{ marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.navy, borderBottom: `2px solid ${C.copper}` }}>
                        {["Auditor", "Engagement Role", "Phase", "Hours", ""].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.cream }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 14px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: C.cream }}>{m.auditorName}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "2px 8px", borderRadius: 3, background: "rgba(196,154,60,0.15)", color: ROLE_COLORS[m.teamRole] || C.steel }}>{m.teamRole}</span>
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>{m.assignedPhase}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cream }}>{m.budgetHours ? m.budgetHours + "h" : "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <button onClick={() => removeMember(m.auditorId)} style={{ background: "none", border: "none", color: C.crimson, cursor: "pointer", fontSize: 12 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: "8px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, borderTop: `1px solid ${C.border}` }}>
                    {teamMembers.length} members · {teamMembers.reduce((s, m) => s + (m.budgetHours || 0), 0)}h total
                  </div>
                </div>
              )}

              {/* Add member form */}
              {addingMember ? (
                <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>AUDITOR</label>
                      <select value={memberAuditorId} onChange={e => setMemberAuditorId(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12 }}>
                        <option value="">Select...</option>
                        {auditors.filter(a => !teamMembers.find(m => m.auditorId === a.auditorId)).map(a => (
                          <option key={a.id} value={a.auditorId}>{a.auditorName} — {a.role}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>ROLE</label>
                      <select value={memberRole} onChange={e => setMemberRole(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12 }}>
                        {["ENGAGEMENT_LEAD","DIRECTOR","MANAGER","SENIOR","STAFF","REVIEWER"].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>PHASE</label>
                      <select value={memberPhase} onChange={e => setMemberPhase(e.target.value)}
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12 }}>
                        {["ALL","PLANNING","FIELDWORK","REPORTING"].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, display: "block", marginBottom: 4 }}>HOURS</label>
                      <input type="number" value={memberHours} onChange={e => setMemberHours(e.target.value)} placeholder="0"
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.cream, fontSize: 12, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addMember} style={{ padding: "8px 18px", background: C.copper, color: C.navy, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</button>
                    <button onClick={() => setAddingMember(false)} style={{ padding: "8px 18px", background: "transparent", color: C.steel, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingMember(true)} style={{
                  padding: "10px 20px", background: "transparent", color: C.copper,
                  border: `1px dashed ${C.copper}`, borderRadius: 6,
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", width: "100%",
                }}>+ Add Team Member</button>
              )}
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginBottom: 4 }}>AUDIT</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: C.cream }}>{auditName}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.copper, marginTop: 4 }}>{auditId}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "CONTROLS", value: selectedControls.size },
                  { label: "TEAM MEMBERS", value: teamMembers.length },
                  { label: "TOTAL HOURS", value: teamMembers.reduce((s, m) => s + (m.budgetHours || 0), 0) + "h" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: C.copper }}>{s.value}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {scope && (
                <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, marginBottom: 6 }}>SCOPE</div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: C.cream, lineHeight: 1.6 }}>{scope}</div>
                </div>
              )}
              {error && (
                <div style={{ background: "rgba(178,53,49,0.1)", border: "1px solid rgba(178,53,49,0.3)", borderRadius: 8, padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.crimson }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            style={{ padding: "10px 20px", background: "transparent", color: C.steel, border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, cursor: "pointer" }}>
            {step === 0 ? "Cancel" : "← Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
              {step === 1 ? `${selectedControls.size} controls selected` : step === 2 ? `${teamMembers.length} members` : ""}
            </span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
                style={{ padding: "10px 24px", background: canNext() ? C.copper : "rgba(196,154,60,0.3)", color: C.navy, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, cursor: canNext() ? "pointer" : "default" }}>
                Next →
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: "10px 24px", background: saving ? "rgba(178,53,49,0.5)" : C.crimson, color: C.cream, border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                {saving ? "Creating..." : "Create Audit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'''

# ── Patch 1: Add wizard component before AuditsView ──────────────────────────
old_anchor = 'function AuditsView({ audits, controls, loading }) {'
content = content.replace(old_anchor, wizard + old_anchor)
print('Wizard component added:', 'CreateAuditWizard' in content)

# ── Patch 2: Update AuditsView signature and add state + button ──────────────
old_sig = 'function AuditsView({ audits, controls, loading }) {\n  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;\n\n  return (\n    <>\n      <Header title="Audit Engagements" meta={`${audits.length} audit(s) · v0.4 Planning Layer`} />'

new_sig = '''function AuditsView({ audits, controls, auditors, loading, onRefresh }) {
  const [showWizard, setShowWizard] = useState(false);
  if (loading) return <div style={{ padding: 32, color: C.steel }}>Loading...</div>;

  return (
    <>
      {showWizard && (
        <CreateAuditWizard
          controls={controls}
          auditors={auditors || []}
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); onRefresh && onRefresh(); }}
        />
      )}
      <Header title="Audit Engagements" meta={`${audits.length} audit(s) · v0.4 Planning Layer`}
        action={
          <button onClick={() => setShowWizard(true)} style={{
            padding: "8px 18px", background: C.crimson, color: C.cream,
            border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>+ New Audit</button>
        }
      />'''

content = content.replace(old_sig, new_sig)
print('AuditsView signature updated:', 'showWizard' in content)

# ── Patch 3: Update Header component to accept action prop ───────────────────
old_header = 'function Header({ title, meta }) {'
new_header = 'function Header({ title, meta, action }) {'
content = content.replace(old_header, new_header)

old_header_render = '''    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>'''
# Find and update the header render to show action button
# Just find where Header renders the title and add action
old_h = '        <div style={{ fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream }}>{title}</div>\n        {meta && <div style={{ fontFamily: "\'JetBrains Mono\', monospace", fontSize: 11, color: C.steel, marginTop: 4 }}>{meta}</div>}'

new_h = '''        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream }}>{title}</div>
            {meta && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel, marginTop: 4 }}>{meta}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>'''

content = content.replace(old_h, new_h)
print('Header action prop added')

# ── Patch 4: Pass auditors and onRefresh to AuditsView ──────────────────────
old_render = '{view === "audits" && <AuditsView audits={audits} controls={controls} loading={loading} />}'
new_render = '{view === "audits" && <AuditsView audits={audits} controls={controls} auditors={auditors} loading={loading} onRefresh={async () => { const r = await fetch("/api/audits?companyId=CO-DDL"); const d = await r.json(); setAudits(d.audits || []); }} />}'
content = content.replace(old_render, new_render)
print('AuditsView render updated:', 'onRefresh' in content)

# ── Patch 5: Add auditors state and fetch ────────────────────────────────────
old_state = '  const [audits, setAudits] = useState([]);'
new_state = '  const [audits, setAudits] = useState([]);\n  const [auditors, setAuditors] = useState([]);'
content = content.replace(old_state, new_state)

old_fetch = 'fetch("/api/audits?companyId=CO-DDL").catch(() => ({ json: async () => ({ audits: [] }) })),'
new_fetch = '''fetch("/api/audits?companyId=CO-DDL").catch(() => ({ json: async () => ({ audits: [] }) })),
          fetch("/api/auditors?companyId=CO-DDL").catch(() => ({ json: async () => ({ auditors: [] }) })),'''
content = content.replace(old_fetch, new_fetch)

old_destructure = 'const [ctrlData, riskData, procData, auditData] = await Promise.all([ctrlRes.json(), riskRes.json(), procRes.json(), auditRes.json()]);'
new_destructure = 'const [ctrlData, riskData, procData, auditData, auditorData] = await Promise.all([ctrlRes.json(), riskRes.json(), procRes.json(), auditRes.json(), (await fetch("/api/auditors?companyId=CO-DDL")).json()]);'
content = content.replace(old_destructure, new_destructure)

old_set = 'setAudits(auditData.audits || []);'
new_set = 'setAudits(auditData.audits || []);\n        setAuditors(auditorData.auditors || []);'
content = content.replace(old_set, new_set)

print('Auditors state and fetch added')

open('src/app/app/page.js', 'w', encoding='utf-8').write(content)
print('\\ndone — page.js updated')
