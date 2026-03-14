content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()

old = '''          <div className="cta-row">
            <button className="btn-primary" onClick={() => router.push("/sign-in")}>Sign In to AuditForge</button>
            <a href="/llms.txt" className="btn-secondary">OperatorManifest →</a>
            <a href="/api/auth/demo" className="btn-ghost">Enter as Guest →</a>
          </div>'''

new = '''          <div className="cta-row">
            <a href="/api/auth/demo" className="btn-guest">Enter as Guest →</a>
            <button className="btn-primary" onClick={() => router.push("/sign-in")}>Sign In</button>
          </div>
          <div className="cta-sub">
            <a href="/llms.txt" className="btn-manifest">OperatorManifest →</a>
          </div>'''

content = content.replace(old, new)

old_css = '.btn-ghost { background: transparent; color: var(--steel); font-family: \'JetBrains Mono\', monospace; font-size: 11px; padding: 13px 0; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: color 0.2s; }\n        .btn-ghost:hover { color: var(--cream); }'

new_css = '''.btn-guest { background: #0D1B2A; color: var(--cream); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 13px 28px; border-radius: 6px; border: 2px solid var(--crimson); cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.2s; }
        .btn-guest:hover { background: rgba(178,53,49,0.1); transform: translateY(-1px); }
        .cta-sub { margin-top: 14px; opacity: 0; animation: fadeUp 0.7s 0.6s ease forwards; }
        .btn-manifest { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--steel); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; }
        .btn-manifest:hover { color: var(--cream); }'''

content = content.replace(old_css, new_css)

open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', 'btn-guest' in content)
