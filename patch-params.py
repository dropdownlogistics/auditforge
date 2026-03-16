content = open('src/app/api/controls/[id]/transition/route.js', encoding='utf-8').read()
fixed = content.replace(
    'const { id } = params;',
    'const { id } = await params;'
)
print('patched:', 'await params' in fixed)
open('src/app/api/controls/[id]/transition/route.js', 'w', encoding='utf-8').write(fixed)
print('done')
