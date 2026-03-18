content = open('src/app/app/page.js', encoding='utf-8').read()
old = '      <Header title="Audit Engagements" meta={${audits.length} audit(s) \u00b7 v0.4 Planning Layer}\n        <button'
new = '      <Header title="Audit Engagements" meta={${audits.length} audit(s) \u00b7 v0.4 Planning Layer}>\n        <button'
fixed = content.replace(old, new)
print('patched:', old in content)
open('src/app/app/page.js', 'w', encoding='utf-8').write(fixed)
print('done')
