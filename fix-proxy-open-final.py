content = open('src/proxy.js', 'r', encoding='utf-8').read()
content = content.replace(
    "  // Unauthenticated hitting anything else -> landing\n  if (!userId) {\n    return NextResponse.redirect(new URL('/landing', request.url))\n  }\n  return NextResponse.next()",
    "  // All routes open — gate at action level\n  return NextResponse.next()"
)
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
