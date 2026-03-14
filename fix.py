content = open('src/app/page.js', 'r', encoding='utf-8').read()
old = '    { id: "dashboard", icon: "◉", label: "Dashboard" },'
new = '    { id: "dashboard", icon: "◉", label: "Dashboard" },\n    { id: "analytics", icon: "◈", label: "Analytics" },'
content = content.replace(old, new, 1)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', 'analytics' in content)
