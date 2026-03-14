content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace('href="/" className="btn-guest"', 'href="/demo" className="btn-guest"')
content = content.replace('href="/sign-in" className="btn-guest"', 'href="/demo" className="btn-guest"')
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)

proxy = open('src/proxy.js', 'r', encoding='utf-8').read()
proxy = proxy.replace(
    "const publicPaths = ['/landing', '/sign-in', '/coming-soon', '/llms.txt', '/icon.svg']",
    "const publicPaths = ['/landing', '/sign-in', '/coming-soon', '/demo', '/llms.txt', '/icon.svg']"
)
open('src/proxy.js', 'w', encoding='utf-8').write(proxy)
print('done')
