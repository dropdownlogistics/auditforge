content = open('src/app/page.js', 'r', encoding='utf-8').read()

mobile_css = """
/* ── Mobile Responsive ─────────────────────────────────────── */
const mobileStyles = `
  @media (max-width: 768px) {
    .af-layout { flex-direction: column !important; }
    .af-sidebar {
      width: 100% !important;
      min-width: unset !important;
      flex-direction: row !important;
      padding: 0 !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(245,241,235,0.08) !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 100 !important;
      background: #10202f !important;
    }
    .af-sidebar-brand { display: none !important; }
    .af-sidebar-search { display: none !important; }
    .af-sidebar-nav-label { display: none !important; }
    .af-sidebar-footer { display: none !important; }
    .af-nav-items {
      display: flex !important;
      flex-direction: row !important;
      width: 100% !important;
      padding: 0 !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }
    .af-nav-item {
      flex-direction: column !important;
      gap: 2px !important;
      padding: 8px 6px !important;
      min-width: 56px !important;
      align-items: center !important;
      border-left: none !important;
      border-top: 2px solid transparent !important;
      font-size: 10px !important;
      flex: 1 !important;
    }
    .af-nav-item.active {
      border-left: none !important;
      border-top: 2px solid #C49A3C !important;
    }
    .af-nav-badge { display: none !important; }
    .af-main {
      padding-bottom: 70px !important;
      margin-bottom: 0 !important;
    }
    .af-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    .af-breakdowns-grid {
      grid-template-columns: 1fr !important;
    }
    .af-header {
      padding: 16px 16px 14px !important;
      flex-direction: column !important;
      gap: 8px !important;
      align-items: flex-start !important;
    }
    .af-content-pad {
      padding: 16px 16px 80px !important;
    }
    .af-analytics-cards {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    .af-analytics-mid {
      grid-template-columns: 1fr !important;
    }
    .af-analytics-bot {
      grid-template-columns: 1fr !important;
    }
    .af-table-wrap { overflow-x: auto !important; }
    .af-generate-grid {
      grid-template-columns: 1fr !important;
    }
    .af-warning-banner {
      font-size: 10px !important;
      padding: 8px 12px !important;
    }
  }
`;
"""

# Add mobile CSS and style injector after the fmtEnum function
style_injector = """
function MobileStyles() {
  return <style>{mobileStyles}</style>;
}
"""

# Add className props to the main layout elements
# Layout wrapper
content = content.replace(
    '<div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>',
    '<div className="af-layout" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>\n      <MobileStyles />'
)

# Sidebar nav
content = content.replace(
    '<nav style={{ width: 240, minWidth: 240, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>',
    '<nav className="af-sidebar" style={{ width: 240, minWidth: 240, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0" }}>'
)

# Sidebar brand section
content = content.replace(
    '<div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>',
    '<div className="af-sidebar-brand" style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>',
    1
)

# Sidebar nav items container
content = content.replace(
    '<div style={{ padding: "8px 0" }}>',
    '<div className="af-nav-items" style={{ padding: "8px 0" }}>',
    1
)

# Nav label
content = content.replace(
    '<div style={{ padding: "16px 12px 8px", fontFamily: "\'JetBrains Mono\', monospace", fontSize: 9, color: C.slate, letterSpacing: "0.1em" }}>NAVIGATION</div>',
    '<div className="af-sidebar-nav-label" style={{ padding: "16px 12px 8px", fontFamily: "\'JetBrains Mono\', monospace", fontSize: 9, color: C.slate, letterSpacing: "0.1em" }}>NAVIGATION</div>'
)

# Nav items - add className
content = content.replace(
    'style={{\n              display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", cursor: "pointer",\n              fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 13,\n              fontWeight: view === n.id ? 600 : 400,\n              color: view === n.id ? C.cream : C.steel,\n              background: view === n.id ? "rgba(196,154,60,0.1)" : "transparent",\n              borderLeft: view === n.id ? `2px solid ${C.copper}` : "2px solid transparent",\n            }}',
    'className={`af-nav-item${view === n.id ? " active" : ""}`}\n            style={{\n              display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", cursor: "pointer",\n              fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 13,\n              fontWeight: view === n.id ? 600 : 400,\n              color: view === n.id ? C.cream : C.steel,\n              background: view === n.id ? "rgba(196,154,60,0.1)" : "transparent",\n              borderLeft: view === n.id ? `2px solid ${C.copper}` : "2px solid transparent",\n            }}'
)

# Nav badge
content = content.replace(
    '{n.id === "audits" && audits.length > 0 && <span style={{ marginLeft: "auto", fontFamily: "\'JetBrains Mono\', monospace", fontSize: 10, color: C.copper }}>{audits.length}</span>}',
    '{n.id === "audits" && audits.length > 0 && <span className="af-nav-badge" style={{ marginLeft: "auto", fontFamily: "\'JetBrains Mono\', monospace", fontSize: 10, color: C.copper }}>{audits.length}</span>}'
)

# Sidebar footer
content = content.replace(
    '<div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>',
    '<div className="af-sidebar-footer" style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>'
)

# Main content area
content = content.replace(
    '<main style={{ flex: 1, overflow: "auto", background: C.navy }}>',
    '<main className="af-main" style={{ flex: 1, overflow: "auto", background: C.navy }}>'
)

# Warning banner
content = content.replace(
    '<div style={{\n            padding: "10px 32px", background: C.warnBg, borderBottom: `1px solid ${C.warnBorder}`,\n            display: "flex", alignItems: "center", gap: 10,\n            fontFamily: "\'JetBrains Mono\', monospace", fontSize: 11, color: C.warn,\n          }}>',
    '<div className="af-warning-banner" style={{\n            padding: "10px 32px", background: C.warnBg, borderBottom: `1px solid ${C.warnBorder}`,\n            display: "flex", alignItems: "center", gap: 10,\n            fontFamily: "\'JetBrains Mono\', monospace", fontSize: 11, color: C.warn,\n          }}>'
)

# Stats grid in Dashboard
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>',
    '<div className="af-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>'
)

# Breakdowns grid in Dashboard
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>',
    '<div className="af-breakdowns-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>'
)

# Content padding areas
content = content.replace(
    '{ padding: "24px 32px 48px" }',
    '{ padding: "24px 32px 48px" } /* af-content-pad */'
)

# Analytics action cards row
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>',
    '<div className="af-analytics-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>'
)

# Analytics middle row (heatmap + funnel)
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>',
    '<div className="af-analytics-mid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>'
)

# Generate grid
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>',
    '<div className="af-generate-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>'
)

# Add the mobile CSS variable and style injector before AuditForgeApp
insert_before = 'export default function AuditForgeApp() {'
content = content.replace(insert_before, mobile_css + '\n' + style_injector + '\n' + insert_before, 1)

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
