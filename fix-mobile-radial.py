content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()
content = content.replace(
    '.stamp-col { opacity: 0; animation: fadeUp 0.9s 0.25s ease forwards; }',
    '.stamp-col { opacity: 0; animation: fadeUp 0.9s 0.25s ease forwards; }\n        @media (max-width: 600px) { .stamp-col svg { max-width: 320px !important; } .stamp-col { overflow: hidden; } }'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
