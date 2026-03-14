content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    '<img src="/af-logo.png" width={28} height={28} alt="AuditForge" style={{ borderRadius: 4 }} />',
    '''<svg width="32" height="32" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="90" fill="none" stroke="#F5F1EB" strokeWidth="2"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="#F5F1EB" strokeWidth="0.8"/>
  <circle cx="100" cy="100" r="95" fill="none" stroke="#F5F1EB" strokeWidth="0.8" strokeDasharray="6 4"/>
  <path d="M 100,18 A 82,82 0 1,1 99.99,18 Z" fill="#9B111E" opacity="0.15"/>
  <circle cx="100" cy="100" r="78" fill="#0D1B2A"/>
  <text x="100" y="88" textAnchor="middle" fontFamily="Space Grotesk,sans-serif" fontWeight="700" fontSize="52" fill="#9B111E">AF</text>
  <circle cx="30" cy="100" r="2" fill="#C49A3C"/>
  <circle cx="170" cy="100" r="2" fill="#C49A3C"/>
</svg>'''
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
