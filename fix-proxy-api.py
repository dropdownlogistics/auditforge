content = open('src/proxy.js', 'r', encoding='utf-8').read()
content = content.replace(
    "const isPublicRoute = createRouteMatcher([\n  '/landing(.*)',\n  '/sign-in(.*)',\n  '/coming-soon(.*)',\n  '/api/auth/demo(.*)',\n  '/api/webhooks(.*)',\n  '/llms.txt',\n])",
    "const isPublicRoute = createRouteMatcher([\n  '/landing(.*)',\n  '/sign-in(.*)',\n  '/coming-soon(.*)',\n  '/(.*)',\n  '/api/(.*)',\n  '/llms.txt',\n])"
)
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
