content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    'href="/sign-in" className="btn-guest"',
    'href="/" className="btn-guest"'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
