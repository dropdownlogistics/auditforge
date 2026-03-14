content = open('src/app/demo/page.jsx', 'r', encoding='utf-8').read()
import re
# Fix all bare border/borderBottom/borderTop with unquoted values
content = re.sub(r'(border(?:Bottom|Top|Left|Right)?):1px solid ([^,"}\s]*)', r'\1:"1px solid \2"', content)
# Fix any remaining empty ones
content = content.replace('borderBottom:1px solid ,', 'borderBottom:"1px solid rgba(245,241,235,0.07)",')
content = content.replace('border:1px solid ,', 'border:"1px solid rgba(245,241,235,0.07)",')
open('src/app/demo/page.jsx', 'w', encoding='utf-8').write(content)
# Check for any remaining
remaining = re.findall(r'border[^:]*:1px', content)
print('remaining:', remaining)
