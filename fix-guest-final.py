content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
# Find and replace the guest button regardless of arrow encoding
import re
content = re.sub(
    r'<a href="#" className="btn-guest" onClick=\{handleGuest\}>.*?</a>',
    '<a href="/sign-in" className="btn-guest">Enter as Guest \u2192</a>',
    content
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', 'href="/sign-in"' in content)
