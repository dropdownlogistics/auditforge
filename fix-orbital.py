content = open('src/app/landing/page.jsx', encoding='utf-8').read()
content = content.replace(
    'viewBox="0 0 400 400"',
    'viewBox="0 0 480 400"'
)
content = content.replace(
    'const cx = 200;',
    'const cx = 210;'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
