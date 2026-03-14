content = open('src/app/page.js', 'r', encoding='utf-8').read()

# Add GlobalSearch render before closing div of main app return
old = '''      </main>
    </div>
  );
}

// ── Header'''

new = '''      </main>
      <GlobalSearch
        controls={controls} risks={risks} processes={processes}
        open={searchOpen} setOpen={setSearchOpen}
        query={searchQuery} setQuery={setSearchQuery}
        onNavigate={setView}
      />
    </div>
  );
}

// ── Header'''

content = content.replace(old, new, 1)
open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('done:', '<GlobalSearch' in content)
