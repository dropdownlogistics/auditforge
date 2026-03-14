content = open('src/app/page.js', 'r', encoding='utf-8').read()

# Fix search icon encoding in sidebar trigger
content = content.replace(
    '<span style={{ color: "#4a6080", fontSize: 13 }}>?</span>',
    '<span style={{ color: "#4a6080", fontSize: 13 }}>⌕</span>'
)
content = content.replace(
    '>?K</kbd>',
    '>⌘K</kbd>'
)

# Add className to the sidebar search div so we can show it differently
content = content.replace(
    '<div onClick={() => setSearchOpen(true)} style={{ margin: "0 12px 8px",',
    '<div className="af-sidebar-search" onClick={() => setSearchOpen(true)} style={{ margin: "0 12px 8px",'
)

# Add search as first item in mobile bottom tab bar by adding it to NAV temporarily
# Instead, add a floating search button for mobile
old_main = '<main className="af-main" style={{ flex: 1, overflow: "auto", background: C.navy }}>'
new_main = '''<main className="af-main" style={{ flex: 1, overflow: "auto", background: C.navy }}>
        {/* Mobile search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="af-mobile-search"
          style={{ display: "none", position: "fixed", bottom: 70, right: 16, zIndex: 99,
            width: 44, height: 44, borderRadius: "50%", background: "#C49A3C",
            border: "none", cursor: "pointer", fontSize: 18, color: "#0D1B2A",
            alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          aria-label="Search"
        >⌕</button>'''

content = content.replace(old_main, new_main)

# Add mobile search button CSS to the media query
content = content.replace(
    '.af-warning-banner {',
    '.af-mobile-search { display: flex !important; }\n    .af-warning-banner {'
)

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done')
