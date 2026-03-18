content = open('src/app/page.jsx', encoding='utf-8').read()

# ── Patch 1: Stat grid ─────────────────────────────────────────
old_stats = '''  const stats = [
    { value: "4", label: "Document Types", sub: "RCM · MCL · Walk · Plan" },
    { value: "3", label: "Frameworks", sub: "COSO · SOX · COBIT" },
    { value: "<30s", label: "To Package", sub: "From live star schema" },
    { value: "0", label: "Manual Formatting", sub: "Structure is the product" },
  ];'''

new_stats = '''  const stats = [
    { value: "106", label: "Governed Controls", sub: "9 process areas · live" },
    { value: "45", label: "Auditors", sub: "9 teams · director to staff" },
    { value: "4", label: "Engagements", sub: "FY2025 · scoped and staffed" },
    { value: "<30s", label: "To Package", sub: "From live star schema" },
  ];'''

content = content.replace(old_stats, new_stats)
print('Stat grid patched:', old_stats in open('src/app/page.jsx', encoding='utf-8').read())

# ── Patch 2: Add roster teaser after features section ──────────
old_anchor = '''      {/* System of Structure */}'''

new_section = '''      {/* Firm Roster Teaser */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <RosterTeaser />
        </FadeSection>
      </section>

      {/* System of Structure */}'''

content = content.replace(old_anchor, new_section)
print('Roster anchor patched:', old_anchor in open('src/app/page.jsx', encoding='utf-8').read())

# ── Patch 3: Add RosterTeaser component before FeatureCards ────
old_feature = '''function FeatureCards() {'''

roster_component = '''function RosterTeaser() {
  const teams = [
    { seat: "1001", director: "Archer Hawthorne", area: "IT General Controls", color: "#6B9DC2" },
    { seat: "1002", director: "Marcus Caldwell", area: "Governance and Oversight", color: "#B23531" },
    { seat: "1003", director: "Elias Mercer", area: "Financial Reporting", color: "#C49A3C" },
    { seat: "1004", director: "Max Sullivan", area: "Vendor Management", color: "#6B9DC2" },
    { seat: "1005", director: "Rowan Bennett", area: "HR and Workforce", color: "#4A9E6B" },
    { seat: "1006", director: "Ava Sinclair", area: "Communications and Ethics", color: "#8a6cc9" },
    { seat: "1007", director: "Leo Prescott", area: "Operations and Change Mgmt", color: "#C49A3C" },
    { seat: "1008", director: "Marcus Grey", area: "Revenue Integrity", color: "#B23531" },
    { seat: "1009", director: "Kai Langford", area: "Data Governance and AI", color: "#4A9E6B" },
  ];
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ width: 32, height: 1, background: "#4A9E6B" }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#4A9E6B",
          }}>THE FIRM</span>
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 800,
          color: "#F5F1EB",
          margin: "0 0 12px",
          lineHeight: 1.15,
        }}>
          45 auditors.{" "}
          <span style={{ color: "#4A9E6B", fontStyle: "italic" }}>9 teams.</span>
        </h2>
        <p style={{
          fontFamily: "'Source Serif 4', serif",
          fontSize: 16,
          color: "rgba(245,241,235,0.55)",
          margin: 0,
          maxWidth: 520,
          lineHeight: 1.7,
        }}>
          Every engagement is staffed from a governed roster — directors, managers, seniors, and staff — each with a ratified competency profile.
        </p>
      </div>

      {/* Director grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        marginBottom: 24,
      }} className="af-roster-grid">
        {teams.map((t) => (
          <div key={t.seat} style={{
            background: "#10202f",
            border: "1px solid rgba(245,241,235,0.07)",
            borderTop: `2px solid ${t.color}`,
            borderRadius: 8,
            padding: "18px 20px",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: t.color,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>SEAT {t.seat} · DIRECTOR</div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "#F5F1EB",
              marginBottom: 4,
            }}>{t.director}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(245,241,235,0.35)",
              letterSpacing: "0.04em",
            }}>{t.area}</div>
            <div style={{
              marginTop: 12,
              display: "flex",
              gap: 4,
              alignItems: "center",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                color: "rgba(245,241,235,0.25)",
                letterSpacing: "0.06em",
              }}>+4 STAFF</div>
            </div>
          </div>
        ))}
      </div>

      {/* Staffing pyramid stat strip */}
      <div style={{
        display: "flex",
        gap: 1,
        background: "rgba(245,241,235,0.07)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 28,
      }}>
        {[
          { role: "Directors", count: "9", color: "#B23531" },
          { role: "Managers", count: "9", color: "#C49A3C" },
          { role: "Seniors", count: "9", color: "#6B9DC2" },
          { role: "Staff", count: "18", color: "#4A9E6B" },
        ].map((r) => (
          <div key={r.role} style={{
            flex: 1,
            background: "#10202f",
            padding: "14px 16px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: r.color,
              lineHeight: 1,
              marginBottom: 4,
            }}>{r.count}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(245,241,235,0.4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>{r.role}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12 }}>
        <a href="/app" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 22px",
          background: "#4A9E6B",
          color: "#F5F1EB",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 6,
          textDecoration: "none",
          letterSpacing: "0.02em",
        }}>View Roster →</a>
      </div>
    </div>
  );
}

function FeatureCards() {'''

content = content.replace(old_feature, roster_component)
print('RosterTeaser component added:', 'RosterTeaser' in content)

# ── Patch 4: Add mobile roster grid CSS ────────────────────────
old_media = '          .af-hero-grid { flex-direction: column-reverse !important; }'
new_media = '''          .af-hero-grid { flex-direction: column-reverse !important; }
          .af-roster-grid { grid-template-columns: 1fr !important; }'''

content = content.replace(old_media, new_media)
print('Mobile roster CSS patched')

# ── Write ───────────────────────────────────────────────────────
open('src/app/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
