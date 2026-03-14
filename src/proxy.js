import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // Always allow API routes
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Always allow static/public pages
  const publicPaths = ['/landing', '/sign-in', '/coming-soon', '/demo', '/llms.txt', '/icon.svg']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    // Authenticated users hitting landing -> app
    if (userId && pathname.startsWith('/landing')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Unauthenticated hitting anything else -> landing
  if (!userId) {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
