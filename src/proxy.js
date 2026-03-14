import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/landing(.*)',
  '/sign-in(.*)',
  '/coming-soon(.*)',
  '/api/auth/demo(.*)',
  '/api/webhooks(.*)',
  '/llms.txt',
])

const isAppRoute = createRouteMatcher([
  '/((?!landing|sign-in|coming-soon|api/auth|api/webhooks|llms.txt|_next|icon.svg).*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // Only gate non-root app routes
  if (!userId && isAppRoute(request) && pathname !== '/' && pathname !== '/landing') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // Authenticated hitting landing — send to app
  if (userId && pathname === '/landing') {
    return NextResponse.redirect(new URL('/', request.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
