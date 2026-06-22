import { SubscriptionPlan } from '../subscriptions/plans';

export const SUPER_ADMIN_EMAIL = 'digitalraje@gmail.com';

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export function normalizeEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase();
}

export function resolvePlatformRole(
  role: string | undefined | null,
  email?: string | null,
): PlatformRole | string {
  if (normalizeEmail(email) === SUPER_ADMIN_EMAIL) {
    return PlatformRole.SUPER_ADMIN;
  }
  return role ?? PlatformRole.USER;
}

export function isPlatformAdmin(
  role: string | undefined | null,
  email?: string | null,
): boolean {
  const resolved = resolvePlatformRole(role, email);
  return resolved === PlatformRole.ADMIN || resolved === PlatformRole.SUPER_ADMIN;
}

export function isSuperAdmin(
  role: string | undefined | null,
  email?: string | null,
): boolean {
  return resolvePlatformRole(role, email) === PlatformRole.SUPER_ADMIN;
}

/** Super admins receive full Enterprise capabilities regardless of subscription row. */
export function resolveEffectivePlan(
  role: string | undefined | null,
  plan: SubscriptionPlan,
  email?: string | null,
): SubscriptionPlan {
  if (isSuperAdmin(role, email)) {
    return SubscriptionPlan.ENTERPRISE;
  }
  return plan;
}
