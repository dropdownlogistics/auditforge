content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    'aria-label="Search"\n        >⌕</button>',
    'aria-label="Search"\n          onTouchEnd={(e) => { e.preventDefault(); setSearchOpen(true); }}\n        >⌕</button>'
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
