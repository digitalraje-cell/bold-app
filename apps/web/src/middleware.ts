import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const protectedPaths = ['/dashboard', '/settings', '/meetings', '/verify', '/billing', '/recordings', '/admin'];
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
    '/dashboard/:path*',
    '/settings/:path*',
    '/meetings/:path*',
    '/verify/:path*',
    '/billing/:path*',
    '/recordings/:path*',
    '/admin/:path*',
  ],
};
