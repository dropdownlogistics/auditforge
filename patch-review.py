content = open('src/app/page.js', encoding='utf-8').read()

# 1. Add ClipboardCheck to import
content = content.replace(
    'import { LayoutDashboard, BarChart2, Shield, AlertTriangle, Network, BookOpen, FileOutput, Upload } from "lucide-react";',
    'import { LayoutDashboard, BarChart2, Shield, AlertTriangle, Network, BookOpen, FileOutput, Upload, ClipboardCheck } from "lucide-react";'
)

# 2. Add Review nav item
content = content.replace(
    '    { id: "generate", icon: FileOutput, label: "Generate" },',
    '    { id: "review", icon: ClipboardCheck, label: "Review" },\n    { id: "generate", icon: FileOutput, label: "Generate" },'
)

# 3. Add view render line
content = content.replace(
    '{view === "generate" && <GenerateView controls={controls} />}',
    '{view === "review" && <ReviewView controls={controls} loading={loading} onRefresh={() => window.location.reload()} />}\n        {view === "generate" && <GenerateView controls={controls} />}'
)

# 4. Insert ReviewView component before Risks section
review_component = '''
// -- Review Queue --
const ADVANCE = { DRAFT: "PREPARED", PREPARED: "REVIEWED", REVIEWED: "APPROVED" };
const ADVANCE_LABEL = { DRAFT: "Mark Prepared", PREPARED: "Mark Reviewed", REVIEWED: "Approve" };
const STATUS_ORDER = ["DRAFT", "PREPARED", "REVIEWED", "APPROVED"];

function ReviewView({ controls, loading, onRefresh }) {
  const [advancing, setAdvancing] = useState({});
  const [errors, setErrors] = useState({});

  if (loading) return <div style={{ padding: 32, color: "#6B7B8D" }}>Loading...</div>;

  const grouped = {};
  STATUS_ORDER.forEach(s => { grouped[s] = []; });
  controls.forEach(c => { if (grouped[c.reviewStatus]) grouped[c.reviewStatus].push(c); });

  const total = controls.length;
  const approved = grouped["APPROVED"].length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const advance = async (ctrl) => {
    const toStatus = ADVANCE[ctrl.reviewStatus];
    if (!toStatus) return;
    setAdvancing(prev => ({ ...prev, [ctrl.id]: true }));
    setErrors(prev => ({ ...prev, [ctrl.id]: null }));
    try {
      const res = await fetch("/api/controls/" + ctrl.id + "/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "REVIEW", toStatus, userId: "demo-user" })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [ctrl.id]: data.error || "Transition failed" }));
      } else {
        onRefresh && onRefresh();
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, [ctrl.id]: e.message }));
    } finally {
      setAdvancing(prev => ({ ...prev, [ctrl.id]: false }));
    }
  };

  return (
    <>
      <Header title="Review Queue" meta={approved + " of " + total + " approved"} />
      <div style={{ padding: "24px 32px 48px" }}>
        <div style={{ background: "#10202f", borderRadius: 8, padding: "16px 20px", marginBottom: 24, border: "1px solid rgba(245,241,235,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6B7B8D" }}>APPROVAL COVERAGE</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#F5F1EB" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(245,241,235,0.08)", borderRadius: 3 }}>
            <div style={{ height: "100%", width: pct + "%", background: pct >= 90 ? "#4A9E6B" : pct >= 70 ? "#C49A3C" : "#B23531", borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
            {STATUS_ORDER.map(s => (
              <span key={s} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>
                {s}: <span style={{ color: "#F5F1EB", fontWeight: 600 }}>{grouped[s].length}</span>
              </span>
            ))}
          </div>
        </div>

        {STATUS_ORDER.filter(s => s !== "APPROVED").map(status => (
          grouped[status].length === 0 ? null : (
            <div key={status} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#F5F1EB" }}>{status}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>{grouped[status].length} controls</span>
                <div style={{ flex: 1, height: 1, background: "rgba(245,241,235,0.06)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grouped[status].map(ctrl => (
                  <div key={ctrl.id} style={{ background: "#10202f", border: "1px solid rgba(245,241,235,0.06)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#F5F1EB", minWidth: 120 }}>{ctrl.controlId}</span>
                    <span style={{ fontFamily: "Source Serif 4, serif", fontSize: 13, color: "#6B7B8D", flex: 1, minWidth: 200 }}>{ctrl.description ? ctrl.description.substring(0, 120) + (ctrl.description.length > 120 ? "..." : "") : ""}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D", minWidth: 80 }}>{ctrl.process?.processArea || ""}</span>
                    {errors[ctrl.id] && <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#B23531" }}>{errors[ctrl.id]}</span>}
                    {ADVANCE[ctrl.reviewStatus] && (
                      <button
                        onClick={() => advance(ctrl)}
                        disabled={advancing[ctrl.id]}
                        style={{ background: advancing[ctrl.id] ? "rgba(196,154,60,0.2)" : "rgba(196,154,60,0.15)", border: "1px solid rgba(196,154,60,0.4)", borderRadius: 6, padding: "6px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 600, color: "#C49A3C", cursor: advancing[ctrl.id] ? "wait" : "pointer", whiteSpace: "nowrap" }}
                      >
                        {advancing[ctrl.id] ? "..." : ADVANCE_LABEL[ctrl.reviewStatus]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {grouped["APPROVED"].length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#4A9E6B" }}>APPROVED</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6B7B8D" }}>{grouped["APPROVED"].length} controls</span>
              <div style={{ flex: 1, height: 1, background: "rgba(245,241,235,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped["APPROVED"].map(ctrl => (
                <div key={ctrl.id} style={{ background: "#10202f", border: "1px solid rgba(74,158,107,0.2)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#4A9E6B", minWidth: 120 }}>{ctrl.controlId}</span>
                  <span style={{ fontFamily: "Source Serif 4, serif", fontSize: 13, color: "#6B7B8D", flex: 1 }}>{ctrl.description ? ctrl.description.substring(0, 120) + (ctrl.description.length > 120 ? "..." : "") : ""}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#4A9E6B" }}>APPROVED</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

'''

content = content.replace('// ── Risks ──', review_component + '// ── Risks ──')

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('patched:', 'ReviewView' in content)
print('done')
