import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const DEMO_USER_ID = 'user_3Ax71ezCXUigiytM7hSjhee552k'

export async function GET(request) {
  try {
    const client = await clerkClient()
    const token = await client.signInTokens.createSignInToken({
      userId: DEMO_USER_ID,
      expiresInSeconds: 300,
    })

    const signInUrl = "https://auditforge.dev/sign-in?token=" + token.token
    return NextResponse.redirect(signInUrl)
  } catch (err) {
    console.error('Demo login error:', err)
    return NextResponse.redirect(new URL('/landing?error=demo', request.url))
  }
}
