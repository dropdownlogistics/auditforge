content = open('src/app/app/page.js', encoding='utf-8').read()
lines = content.split('\n')
# Fix line 1042 (index 1041) — add > after the meta prop
lines[1041] = lines[1041].rstrip() + '>'
print('Line 1042 is now:', lines[1041])
open('src/app/app/page.js', 'w', encoding='utf-8').write('\n'.join(lines))
print('done')
