content = open('src/app/app/page.js', encoding='utf-8').read()

old = '''      <Header title="Audit Engagements" meta={${audits.length} audit(s) · v0.4 Planning Layer}
        action={
          <button onClick={() => setShowWizard(true)} style={{
            padding: "8px 18px", background: C.crimson, color: C.cream,
            border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>+ New Audit</button>
        }
      />'''

new = '''      <Header title="Audit Engagements" meta={${audits.length} audit(s) \u00b7 v0.4 Planning Layer}>
        <button onClick={() => setShowWizard(true)} style={{
          padding: "8px 18px", background: C.crimson, color: C.cream,
          border: "none", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>+ New Audit</button>
      </Header>'''

fixed = content.replace(old, new)
print('patched:', old in content)
print('new in file:', 'New Audit' in fixed)
open('src/app/app/page.js', 'w', encoding='utf-8').write(fixed)
print('done')
