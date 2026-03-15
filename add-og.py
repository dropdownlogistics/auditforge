content = open('src/app/layout.js', 'r', encoding='utf-8').read()
content = content.replace(
    'export const metadata = {',
    '''export const metadata = {
  metadataBase: new URL('https://auditforge.dev'),
  openGraph: {
    title: 'AuditForge — Governed Audit Documentation',
    description: 'The audit package generates itself. Controls, risks, and processes become governed RCMs, MCLs, and walkthroughs in seconds from a live star schema.',
    url: 'https://auditforge.dev',
    siteName: 'AuditForge',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AuditForge' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditForge — Governed Audit Documentation',
    description: 'The audit package generates itself.',
    images: ['/og-image.png'],
  },
  //'''
)
open('src/app/layout.js', 'w', encoding='utf-8').write(content)
print('done')
