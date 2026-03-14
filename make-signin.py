import os
os.makedirs('src/app/sign-in/[[...sign-in]]', exist_ok=True)
content = '''import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <SignIn />
    </div>
  )
}
'''
open('src/app/sign-in/[[...sign-in]]/page.jsx', 'w', encoding='utf-8').write(content)
print('done')
