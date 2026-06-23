import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import {
  AUTHENTICATED_HOME,
  isAuthGuestAliasRoute,
  isAuthGuestRoute,
} from '@/lib/auth-routes';
import {
  isProtectedRoute,
  resolveAdminRouteAlias,
} from '@/lib/route-access';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const adminAlias = resolveAdminRouteAlias(pathname);

  if (isLoggedIn && isAuthGuestRoute(pathname)) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, req.nextUrl.origin));
  }

  if (
    isLoggedIn &&
    pathname.startsWith('/verify') &&
    req.auth?.user?.isVerified
  ) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, req.nextUrl.origin));
  }

  if (!isLoggedIn && isAuthGuestAliasRoute(pathname)) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((value, key) => {
      loginUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedRoute(pathname) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (adminAlias) {
    const target = new URL(adminAlias, req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    return NextResponse.redirect(target);
  }

  if (
    pathname.startsWith('/meetings/create') &&
    isLoggedIn &&
    !req.auth?.user?.isVerified
  ) {
    return NextResponse.redirect(new URL('/verify', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/register',
    '/signin',
    '/auth/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/meetings/:path*',
    '/verify',
    '/verify/:path*',
    '/billing/:path*',
    '/recordings/:path*',
    '/admin/:path*',
    '/admin-users',
    '/admin-users/:path*',
    '/admin-payments',
    '/admin-payments/:path*',
    '/releases',
    '/releases/:path*',
    '/youtube-live',
    '/youtube-live/:path*',
  ],
};
