import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SignIn appearance={{
        variables: {
          colorPrimary: '#B23531',
          colorBackground: '#10202f',
          colorInputBackground: '#0D1B2A',
          colorInputText: '#F5F1EB',
          colorText: '#F5F1EB',
          colorTextSecondary: '#4a6080',
          colorTextOnPrimaryBackground: '#F5F1EB',
          colorNeutral: '#F5F1EB',
          borderRadius: '8px',
        },
        elements: {
          card: { boxShadow: 'none', border: '1px solid rgba(245,241,235,0.07)' },
          formButtonPrimary: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F5F1EB' },
          footerActionLink: { color: '#B23531' },
          identityPreviewText: { color: '#F5F1EB' },
          formFieldLabel: { color: '#F5F1EB' },
          headerTitle: { color: '#F5F1EB' },
          headerSubtitle: { color: '#4a6080' },
        }
      }} />
    </div>
  )
}
