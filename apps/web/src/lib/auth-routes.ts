/** Default destination for authenticated users hitting guest-only auth entry points. */
export const AUTHENTICATED_HOME = '/dashboard';

/** Logged-in destination for instant meeting creation. */
export const START_MEETING_AUTH_HREF = '/meetings/create?type=instant';

/** Guest login entry for “Start a Meeting” CTAs. */
export const START_MEETING_LOGIN_HREF = `/login?callbackUrl=${encodeURIComponent(START_MEETING_AUTH_HREF)}`;

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

/** Reject open redirects; only same-origin relative paths are allowed. */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback = AUTHENTICATED_HOME,
): string {
  if (!raw?.trim()) return fallback;

  const url = raw.trim();
  if (!url.startsWith('/') || url.startsWith('//')) return fallback;
  if (url.includes('://') || url.includes('\\')) return fallback;

  try {
    const decoded = decodeURIComponent(url);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('://')) {
      return fallback;
    }
    return decoded;
  } catch {
    return fallback;
  }
}
