content = open('src/app/page.js', 'r', encoding='utf-8').read()
content = content.replace(
    '''aria-label="Search"
          onTouchEnd={(e) => { e.preventDefault(); setSearchOpen(true); }}
        >⌕</button>''',
    '''aria-label="Search"
          onClick={() => setSearchOpen(true)}
          onTouchEnd={(e) => { e.preventDefault(); setSearchOpen(true); }}
        >⌕</button>'''
)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
