content = open('src/proxy.js', 'r', encoding='utf-8').read()
content = content.replace(
    "  // Authenticated users hitting landing -> app\n  if (userId && pathname.startsWith('/landing')) {\n    return NextResponse.redirect(new URL('/', request.url))\n  }",
    "  // Landing is always accessible"
)
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
