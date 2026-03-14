content = open('src/app/layout.js', 'r', encoding='utf-8').read()
content = content.replace(
    'import "./globals.css";',
    'import "./globals.css";\nimport { ClerkProvider } from "@clerk/nextjs";'
)
content = content.replace(
    '<html',
    '<ClerkProvider>\n      <html'
)
content = content.replace(
    '</html>',
    '</html>\n    </ClerkProvider>'
)
open('src/app/layout.js', 'w', encoding='utf-8').write(content)
print('done')
