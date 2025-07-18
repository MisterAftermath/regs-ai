import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('[Middleware] Processing request for:', pathname);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    console.log('[Middleware] Allowing auth API request');
    return NextResponse.next();
  }

  // Allow access to login and register pages without authentication
  if (['/login', '/register'].includes(pathname)) {
    console.log('[Middleware] Checking auth status for login/register page');
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  console.log('[Middleware] Token present:', !!token, 'Email:', token?.email);

  if (!token) {
    if (!['/login', '/register'].includes(pathname)) {
      console.log('[Middleware] No token, redirecting to login');
      // Redirect to login instead of creating guest user
      return NextResponse.redirect(new URL('/login', request.url));
    }
    console.log('[Middleware] No token, but already on login/register page');
    return NextResponse.next();
  }

  const isGuest = guestRegex.test(token?.email ?? '');
  console.log('[Middleware] Is guest:', isGuest);

  // Redirect guest users to login (optional - to clean up any existing guest sessions)
  if (isGuest) {
    console.log('[Middleware] Guest user detected, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/register pages
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    console.log(
      '[Middleware] Authenticated user on login/register page, redirecting to home',
    );
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[Middleware] Allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
