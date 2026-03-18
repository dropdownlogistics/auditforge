content = open('src/app/app/page.js', encoding='utf-8').read()

old = '          }}>+ New Audit</button>\n      </Header>\n      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>'

new = '          }}>+ New Audit</button>\n      </Header>\n      <AuditProgramAnalytics audits={audits} />\n      <div style={{ padding: "0 32px", marginBottom: 8 }}>\n        <div style={{ fontFamily: "\'JetBrains Mono\', monospace", fontSize: 10, fontWeight: 700, color: "#C49A3C", letterSpacing: "0.1em" }}>ENGAGEMENT DETAIL</div>\n      </div>\n      <div style={{ padding: "24px 32px 48px" } /* af-content-pad */}>'

fixed = content.replace(old, new)
print("patched:", old in content)
open('src/app/app/page.js', 'w', encoding='utf-8').write(fixed)
print('done')
