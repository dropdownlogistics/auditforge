# Fix app/page.js - AuditForge logo link
content = open('src/app/app/page.js', encoding='utf-8').read()
fixed = content.replace('href="/landing"', 'href="/"')
open('src/app/app/page.js', 'w', encoding='utf-8').write(fixed)
print('app/page.js fixed:', 'href="/landing"' not in fixed)

# Fix coming-soon/page.jsx
content2 = open('src/app/coming-soon/page.jsx', encoding='utf-8').read()
fixed2 = content2.replace('router.push("/landing")', 'router.push("/")')
open('src/app/coming-soon/page.jsx', 'w', encoding='utf-8').write(fixed2)
print('coming-soon fixed:', 'router.push("/landing")' not in fixed2)
