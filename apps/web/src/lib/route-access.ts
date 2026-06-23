/** Exact public marketing and auth entry paths (no login required). */
export const PUBLIC_EXACT_ROUTES = new Set([
  '/',
  '/about',
  '/features',
  '/pricing',
  '/roadmap',
  '/contact',
  '/login',
  '/signup',
  '/register',
  '/signin',
  '/terms',
  '/privacy',
  '/refund',
  '/cookies',
  '/home',
  '/join',
]);

/** Prefixes that stay public for guests (meeting join flows). */
const PUBLIC_PREFIXES = ['/join/', '/meeting/'];

/** Prefixes that require an authenticated session. */
export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/meetings',
  '/billing',
  '/settings',
  '/verify',
  '/recordings',
  '/admin',
  '/admin-users',
  '/admin-payments',
  '/releases',
  '/youtube-live',
];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Legacy admin shortcuts → canonical dashboard admin paths. */
export const ADMIN_ROUTE_ALIASES: Record<string, string> = {
  '/admin-users': '/admin/users',
  '/admin-payments': '/admin/payments',
  '/releases': '/admin/releases',
  '/youtube-live': '/admin/youtube',
};

export function resolveAdminRouteAlias(pathname: string): string | null {
  if (pathname in ADMIN_ROUTE_ALIASES) {
    return ADMIN_ROUTE_ALIASES[pathname];
  }
  for (const [alias, target] of Object.entries(ADMIN_ROUTE_ALIASES)) {
    if (pathname.startsWith(`${alias}/`)) {
      return `${target}${pathname.slice(alias.length)}`;
    }
  }
  return null;
}
