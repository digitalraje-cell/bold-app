'use client';

import {
  SubscriptionPlan,
  PermissionKey,
  resolvePlanPermissions,
  checkPermission,
  resolveEffectivePlan,
  shouldShowUpgradeCTA,
  isPremiumPlan,
} from '@boldmeet/shared';
import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  const rawPlan = (session?.user?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
  const role = session?.user?.role;
  const email = session?.user?.email;
  const plan = resolveEffectivePlan(role, rawPlan, email);
  const permissions = resolvePlanPermissions(plan);

  return {
    plan,
    rawPlan,
    role,
    limits: permissions.limits,
    can: (key: PermissionKey) => checkPermission(plan, key),
    isVerified: session?.user?.isVerified ?? false,
    canHost: (session?.user?.isVerified ?? false) && checkPermission(plan, 'canHostMeeting'),
    isPremium: isPremiumPlan(plan),
    shouldShowUpgrade: shouldShowUpgradeCTA(rawPlan, role, email),
  };
}
