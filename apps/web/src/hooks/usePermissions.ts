'use client';

import {
  SubscriptionPlan,
  PermissionKey,
  resolvePlanPermissions,
  checkPermission,
} from '@boldmeet/shared';
import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  const plan = (session?.user?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
  const permissions = resolvePlanPermissions(plan);

  return {
    plan,
    limits: permissions.limits,
    can: (key: PermissionKey) => checkPermission(plan, key),
    isVerified: session?.user?.isVerified ?? false,
    canHost: (session?.user?.isVerified ?? false) && checkPermission(plan, 'canHostMeeting'),
  };
}
