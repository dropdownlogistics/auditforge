content = open('src/app/landing/page.jsx', encoding='utf-8').read()
fixed = content.replace(
    '  .af-orbital { display: none !important; }',
    '''  .af-orbital { width: 100% !important; max-width: 340px !important; margin: 0 auto 8px !important; }
  .af-hero-grid { align-items: center !important; }'''
)
fixed = fixed.replace(
    '  .af-hero-grid { flex-direction: column !important; }',
    '  .af-hero-grid { flex-direction: column-reverse !important; }'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(fixed)
print('done')
