/** Default destination for authenticated users hitting guest-only auth entry points. */
export const AUTHENTICATED_HOME = '/dashboard';

const EXACT_AUTH_GUEST_ROUTES = new Set([
  '/login',
  '/signup',
  '/register',
  '/signin',
]);

/** Routes that should only be shown to guests (login, signup, auth aliases). */
export function isAuthGuestRoute(pathname: string): boolean {
  if (EXACT_AUTH_GUEST_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/auth/')) return true;
  return false;
}

/** Legacy aliases that should resolve to /login for guests. */
export function isAuthGuestAliasRoute(pathname: string): boolean {
  return pathname === '/signup' || pathname === '/register' || pathname === '/signin';
}

/** Whether a pathname points at a login/signup style CTA target. */
export function isAuthCtaHref(href: string): boolean {
  if (!href.startsWith('/')) return false;
  const path = href.split('?')[0]?.split('#')[0] ?? href;
  return isAuthGuestRoute(path) || isAuthGuestAliasRoute(path);
}

export function resolveAuthAwareHref(
  href: string,
  isAuthenticated: boolean,
  authHref: string = AUTHENTICATED_HOME,
): string {
  if (isAuthenticated && isAuthCtaHref(href)) return authHref;
  return href;
}
