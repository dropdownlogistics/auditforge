content = '''import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.redirect(new URL('/sign-in', request.url))
}
'''
open('src/app/api/auth/demo/route.js', 'w', encoding='utf-8').write(content)
print('done')
