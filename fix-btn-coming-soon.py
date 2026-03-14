content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace('router.push("/sign-in")', 'router.push("/coming-soon")')
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
