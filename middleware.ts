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

  // Always allow auth API requests
  if (pathname.startsWith('/api/auth')) {
    console.log('[Middleware] Allowing auth API request');
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !isDevelopmentEnvironment,
    });

    console.log('[Middleware] Token present:', !!token, 'Email:', token?.email);

    // No token - handle unauthenticated users
    if (!token) {
      // Allow access to public routes
      if (isPublicRoute) {
        console.log('[Middleware] No token, allowing access to public route');
        return NextResponse.next();
      }

      // Redirect to login for protected routes
      console.log('[Middleware] No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if guest user
    const isGuest = guestRegex.test(token?.email ?? '');
    console.log('[Middleware] Is guest:', isGuest);

    // Handle guest users
    if (isGuest) {
      // Allow guest users on login/register pages
      if (isPublicRoute) {
        console.log('[Middleware] Guest user on public route, allowing');
        return NextResponse.next();
      }

      // Redirect guest users to login from other pages
      console.log(
        '[Middleware] Guest user on protected route, redirecting to login',
      );
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Handle authenticated (non-guest) users
    if (isPublicRoute) {
      console.log(
        '[Middleware] Authenticated user on public route, redirecting to home',
      );
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow authenticated users to access protected routes
    console.log(
      '[Middleware] Authenticated user accessing protected route, allowing',
    );
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error getting token:', error);

    // On error, allow public routes but protect others
    if (isPublicRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }
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
