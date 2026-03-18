content = open('src/app/app/page.js', encoding='utf-8').read()

# Fix Header to accept action prop alongside children
old = 'function Header({ title, meta, children }) {'
new = 'function Header({ title, meta, children, action }) {'
content = content.replace(old, new)

# Find where Header renders and add action
old_h = '      <div>\n        <div style={{ fontFamily: "\'Space Grotesk\', sans-serif", fontSize: 22, fontWeight: 700, color: C.cream }}>{title}</div>\n        <div style={{ fontFamily: "\'JetBrains'
print('Finding header render...')
idx = content.find('function Header(')
chunk = content[idx:idx+600]
print(chunk)
