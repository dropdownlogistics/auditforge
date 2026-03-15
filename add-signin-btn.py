content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    '<div className="af-sidebar-footer"',
    '''<div className="af-sidebar-footer">
            <a href="/sign-in" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:6, background:"rgba(178,53,49,0.1)", border:"1px solid rgba(178,53,49,0.2)", textDecoration:"none", marginBottom:12 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#B23531", letterSpacing:"0.06em" }}>Sign In →</span>
            </a>
          </div>
          <div style={{display:"none"}} className="af-sidebar-footer"'''
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
