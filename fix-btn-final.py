content = open('src/app/app/page.js', encoding='utf-8').read()
old = '          }}>+ New Audit</button>\n        }\n      />'
new = '          }}>+ New Audit</button>\n      </Header>'
fixed = content.replace(old, new)
print('patched:', old in content)
# Also need to remove the action={ opening
old2 = '        action={\n          <button onClick={() => setShowWizard(true)}'
new2 = '        <button onClick={() => setShowWizard(true)}'
fixed = fixed.replace(old2, new2)
print('action removed:', old2 in content)
open('src/app/app/page.js', 'w', encoding='utf-8').write(fixed)
print('done')
