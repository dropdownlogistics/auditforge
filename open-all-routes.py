content = open('src/proxy.js', 'r', encoding='utf-8').read()
content = content.replace(
    "  // Unauthenticated hitting import page -> landing\n  if (!userId && pathname.startsWith('/import')) {\n    return NextResponse.redirect(new URL('/landing', request.url))\n  }",
    "  // All routes open for demo — gate at action level, not route level"
)
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
