content = open('src/proxy.js', 'r', encoding='utf-8').read()
content = content.replace(
    "  // Unauthenticated hitting the app — send to landing\n  if (!userId && isAppRoute(request) && pathname !== '/landing') {\n    return NextResponse.redirect(new URL('/landing', request.url))\n  }",
    "  // Only gate non-root app routes\n  if (!userId && isAppRoute(request) && pathname !== '/' && pathname !== '/landing') {\n    return NextResponse.redirect(new URL('/landing', request.url))\n  }"
)
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
