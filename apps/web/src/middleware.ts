import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import {
  AUTHENTICATED_HOME,
  isAuthGuestAliasRoute,
  isAuthGuestRoute,
} from '@/lib/auth-routes';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

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

  const protectedPaths = [
    '/dashboard',
    '/settings',
    '/meetings',
    '/verify',
    '/billing',
    '/recordings',
    '/admin',
  ];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
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
  ],
};
