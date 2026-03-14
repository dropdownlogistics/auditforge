content = open('src/app/demo/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    'border:"1px solid rgba(178",53,49,0.2)',
    'border:"1px solid rgba(178,53,49,0.2)"'
)
open('src/app/demo/page.jsx', 'w', encoding='utf-8').write(content)
print('fixed:', 'rgba(178,53,49,0.2)"' in content)
