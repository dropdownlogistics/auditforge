content = open('src/app/page.js', 'r', encoding='utf-8').read()

team_section = '''
              {/* Team Roster */}
              {audit.team && audit.team.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.copper, marginBottom: 12 }}>ENGAGEMENT TEAM</div>
                  <div style={{ background: C.card, border: 1px solid , borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: 2px solid , background: C.navy }}>
                          {['Auditor', 'Role', 'Phase', 'Budget Hours'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.cream }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {audit.team.sort((a, b) => {
                          const order = { PARTNER: 0, REVIEWER: 1, MANAGER: 2, SENIOR: 3, STAFF: 4 }
                          return (order[a.teamRole] ?? 5) - (order[b.teamRole] ?? 5)
                        }).map((t, i) => (
                          <tr key={i} style={{ borderBottom: 1px solid  }}>
                            <td style={{ padding: '10px 16px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.cream }}>{t.auditor?.auditorName}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '2px 8px', borderRadius: 3,
                                background: t.teamRole === 'PARTNER' ? 'rgba(178,53,49,0.15)' : t.teamRole === 'MANAGER' ? 'rgba(196,154,60,0.15)' : t.teamRole === 'SENIOR' ? 'rgba(107,157,194,0.15)' : 'rgba(74,158,107,0.15)',
                                color: t.teamRole === 'PARTNER' ? '#B23531' : t.teamRole === 'MANAGER' ? '#C49A3C' : t.teamRole === 'SENIOR' ? '#6B9DC2' : '#4A9E6B'
                              }}>{t.teamRole}</span>
                            </td>
                            <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>{t.assignedPhase}</td>
                            <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.cream }}>{t.budgetHours ? t.budgetHours + 'h' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '10px 16px', borderTop: 1px solid , fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                      {audit.team.length} auditors · {audit.team.reduce((sum, t) => sum + (t.budgetHours || 0), 0)}h total budget
                    </div>
                  </div>
                </div>
              )}
'''

content = content.replace(
    "              {/* Scope Table */}",
    team_section + "              {/* Scope Table */}"
)

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', 'ENGAGEMENT TEAM' in content)
