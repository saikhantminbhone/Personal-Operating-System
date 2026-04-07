import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuth = !!token
  const isAuthPage = pathname.startsWith('/auth')

  // Root → redirect based on auth status
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuth ? '/dashboard' : '/auth/login', request.url)
    )
  }

  // Already logged in → redirect away from auth pages
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Not logged in → redirect to login
  if (pathname.startsWith('/dashboard') && !isAuth) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/auth/:path*', '/dashboard/:path*'],
}
