content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    "border: 1px solid , borderRadius: 8, overflow: 'hidden'",
    "border: '1px solid rgba(245,241,235,0.07)', borderRadius: 8, overflow: 'hidden'"
)
content = content.replace(
    "borderBottom: 2px solid , background: C.navy",
    "borderBottom: '2px solid #C49A3C', background: C.navy"
)
content = content.replace(
    "borderBottom: 1px solid  }}>",
    "borderBottom: '1px solid rgba(245,241,235,0.07)' }}>"
)
content = content.replace(
    "borderTop: 1px solid ,",
    "borderTop: '1px solid rgba(245,241,235,0.07)',"
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
