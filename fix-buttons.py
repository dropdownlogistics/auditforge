content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    'onClick={() => router.push("/")}',
    'onClick={() => router.push("/sign-in")}'
)
content = content.replace(
    "onClick={() => router.push('/')}",
    "onClick={() => router.push('/sign-in')}"
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', '/sign-in' in content)
