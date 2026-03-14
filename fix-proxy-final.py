content = '''import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/import(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // API routes — always open
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Static/public pages — always open
  if (['/landing', '/sign-in', '/coming-soon', '/llms.txt'].some(p => pathname.startsWith(p))) {
    if (userId && pathname === '/landing') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Everything else — open for now (demo mode)
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
'''
open('src/proxy.js', 'w', encoding='utf-8').write(content)
print('done')
