import {
  resolveUserRoleForEmail,
  SUPER_ADMIN_EMAIL,
  resolveSuperAdminRole,
} from '@boldmeet/shared';
import { PlanStatus, SubscriptionPlan, UserRole } from '@prisma/client';

export { SUPER_ADMIN_EMAIL, resolveSuperAdminRole };

export function resolveUserRoleForEmailPrisma(email: string): UserRole {
  return resolveUserRoleForEmail(email) === 'SUPER_ADMIN'
    ? UserRole.SUPER_ADMIN
    : UserRole.USER;
}

export function defaultSubscriptionData(
  plan: SubscriptionPlan = SubscriptionPlan.FREE,
) {
  return {
    planName: plan,
    planStatus: PlanStatus.ACTIVE,
    planStartDate: new Date(),
    paymentStatus: 'none',
  };
}
