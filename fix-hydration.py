content = open('src/app/landing/page.jsx', encoding='utf-8').read()
fixed = content.replace(
    'function OrbitalHero() {',
    'function OrbitalHero() {\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);\n  if (!mounted) return <div style={{ width: 500, height: 420 }} />;'
)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(fixed)
print('done')
