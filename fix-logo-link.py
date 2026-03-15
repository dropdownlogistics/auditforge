content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    '<div style={{ fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream }}>AuditForge</div>',
    '<a href="/landing" style={{ fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 18, fontWeight: 700, color: C.cream, textDecoration: "none" }}>AuditForge</a>'
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', '/landing' in content)
