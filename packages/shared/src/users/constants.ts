import { SubscriptionPlan } from '../subscriptions/plans';

export const SUPER_ADMIN_EMAIL = 'digitalraje@gmail.com';

export function resolveSuperAdminRole(email: string): 'SUPER_ADMIN' | null {
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : null;
}

export function resolveUserRoleForEmail(email: string): 'USER' | 'SUPER_ADMIN' {
  return resolveSuperAdminRole(email) ?? 'USER';
}

export function defaultSubscriptionCreateData(plan: SubscriptionPlan = SubscriptionPlan.FREE) {
  return {
    planName: plan,
    planStatus: 'ACTIVE' as const,
    planStartDate: new Date(),
    paymentStatus: 'none',
  };
}
