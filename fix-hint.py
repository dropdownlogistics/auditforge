content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    '<div className="cta-sub">',
    '<div className="cta-hint">demo@auditforge.dev &nbsp;·&nbsp; DDLogistics!9*6</div>\n          <div className="cta-sub">'
)
content = content.replace(
    '.btn-manifest:hover { color: var(--cream); }',
    '.btn-manifest:hover { color: var(--cream); }\n        .cta-hint { font-family: \'JetBrains Mono\', monospace; font-size: 10px; color: #1a2e42; letter-spacing: 0.06em; margin-top: 14px; }'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
