content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    '<a href="/llms.txt" className="btn-secondary">OperatorManifest →</a>',
    '<a href="/llms.txt" className="btn-secondary">OperatorManifest →</a>\n            <a href="/api/auth/demo" className="btn-ghost">Enter as Guest →</a>'
)
content = content.replace(
    '.btn-secondary:hover { border-color: var(--border-crimson); color: var(--cream); }',
    '.btn-secondary:hover { border-color: var(--border-crimson); color: var(--cream); }\n        .btn-ghost { background: transparent; color: var(--steel); font-family: \'JetBrains Mono\', monospace; font-size: 11px; padding: 13px 0; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: color 0.2s; }\n        .btn-ghost:hover { color: var(--cream); }'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', 'Enter as Guest' in content)
