content = '''import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // Always allow API routes
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Authenticated users hitting landing -> app
  if (userId && pathname.startsWith('/landing')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Everything else is open
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
'''
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
