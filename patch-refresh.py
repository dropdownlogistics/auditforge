content = open('src/app/page.js', encoding='utf-8').read()

# Add refetchControls function after the load() function closes
old = '''    load();
  }, []);'''

new = '''    load();
  }, []);

  const refetchControls = async () => {
    try {
      const res = await fetch('/api/controls?companyId=CO-DDL');
      const data = await res.json();
      setControls(data.controls || []);
    } catch (e) { console.error('Refetch failed:', e); }
  };'''

content = content.replace(old, new)

# Wire onRefresh to refetchControls instead of reload
content = content.replace(
    'onRefresh={() => window.location.reload()}',
    'onRefresh={refetchControls}'
)

open('src/app/page.js', 'w', encoding='utf-8').write(content)
print('patched:', 'refetchControls' in content)
print('done')
