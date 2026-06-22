import { isPlatformAdmin, resolvePlatformRole } from '@boldmeet/shared';

export type AdminAccessSubject = {
  role?: string | null;
  email?: string | null;
};

/** Merge DB + session fields so super-admin email fallback always applies. */
export function resolveAdminAccess(
  dbUser: AdminAccessSubject | null | undefined,
  sessionUser: AdminAccessSubject | null | undefined,
) {
  const email = dbUser?.email ?? sessionUser?.email ?? null;
  const dbRole = dbUser?.role ?? null;
  const sessionRole = sessionUser?.role ?? null;
  const resolvedRole = resolvePlatformRole(dbRole ?? sessionRole, email);

  return {
    email,
    dbRole,
    sessionRole,
    resolvedRole,
    allowed: isPlatformAdmin(dbRole ?? sessionRole, email),
  };
}
