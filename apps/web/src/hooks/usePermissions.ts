'use client';

import {
  SubscriptionPlan,
  PermissionKey,
  resolvePlanPermissions,
  checkPermission,
  resolveEffectivePlan,
} from '@boldmeet/shared';
import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  const rawPlan = (session?.user?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
  const plan = resolveEffectivePlan(
    session?.user?.role,
    rawPlan,
    session?.user?.email,
  );
  const permissions = resolvePlanPermissions(plan);

  return {
    plan,
    rawPlan,
    role: session?.user?.role,
    limits: permissions.limits,
    can: (key: PermissionKey) => checkPermission(plan, key),
    isVerified: session?.user?.isVerified ?? false,
    canHost: (session?.user?.isVerified ?? false) && checkPermission(plan, 'canHostMeeting'),
  };
}
