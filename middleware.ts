import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shouldRedirect, getDashboardPath } from './lib/roleGuard'
import { authApi } from './lib/api'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/event/') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // For dashboard routes, check role
  if (pathname.startsWith('/dashboard')) {
    // This will be handled client-side since we need localStorage
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
