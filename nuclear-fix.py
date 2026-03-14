import re

demo = open('src/app/demo/page.jsx', 'r', encoding='utf-8').read()

# Fix ALL border variants with unquoted values
patterns = [
    (r'border:"1px solid rgba\(178,53,49,0\.4\)"', 'border:"1px solid rgba(178,53,49,0.4)"'),
]

# Nuclear fix - replace every instance of border:1px solid X with quoted version
def fix_border(m):
    prop = m.group(1)
    val = m.group(2).strip()
    if not val or val == ',':
        return prop + ':"1px solid rgba(245,241,235,0.07)"'
    return prop + ':"1px solid ' + val + '"'

demo = re.sub(r'(border(?:Bottom|Top|Left|Right)?):\s*1px solid\s*([^,"}\n]*)', fix_border, demo)

open('src/app/demo/page.jsx', 'w', encoding='utf-8').write(demo)

remaining = [l.strip() for l in demo.split('\n') if '1px solid' in l and '"1px solid' not in l]
print('remaining unquoted:', len(remaining))
for r in remaining[:5]:
    print(' ', r[:100])
