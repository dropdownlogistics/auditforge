import re
content = open('src/app/demo/page.jsx', 'r', encoding='utf-8').read()
content = re.sub(r'border:1px solid ([^,}]+)[,}]', lambda m: 'border:"1px solid ' + m.group(1).strip() + '"' + m.string[m.end()-1], content)
content = content.replace('border:1px solid ,', 'border:"1px solid rgba(245,241,235,0.07)",')
content = content.replace('border:1px solid  ,', 'border:"1px solid rgba(245,241,235,0.07)",')
open('src/app/demo/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
