content = open('src/app/api/auth/demo/route.js', 'r', encoding='utf-8').read()
content = content.replace(
    'const signInUrl = https://auditforge.dev/sign-in?token=',
    'const signInUrl = "https://auditforge.dev/sign-in?token=" + token.token'
)
open('src/app/api/auth/demo/route.js', 'w', encoding='utf-8').write(content)
print('done')
