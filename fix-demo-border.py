content = open('src/app/demo/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    'border:1px solid 40,',
    'border:"1px solid rgba(178,53,49,0.4)",'
)
open('src/app/demo/page.jsx', 'w', encoding='utf-8').write(content)
print('demo fixed:', 'rgba(178,53,49,0.4)' in content)
