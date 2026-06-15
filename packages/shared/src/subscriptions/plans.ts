/**
 * Subscription plan identifiers.
 * Add new plans here — never hardcode plan checks in business logic.
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Permission keys resolved from a user's active plan.
 * Use PermissionsService.check(userId, key) — do not compare plans directly.
 */
export type PermissionKey =
  | 'canStreamToYoutube'
  | 'canUseCohost'
  | 'canRecord'
  | 'canInvite'
  | 'canHostMeeting'
  | 'canUseWaitingRoom'
  | 'canUseChat'
  | 'canUseRaiseHand'
  | 'canUseReactions';

export interface PlanLimits {
  maxMeetingDurationMinutes: number | null;
  attendeeLimit: number;
  maxCohosts: number;
  maxHosts: number;
  gracePeriodMinutes: number;
}

export interface PlanPermissions {
  limits: PlanLimits;
  permissions: Record<PermissionKey, boolean>;
}

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanPermissions> = {
  [SubscriptionPlan.FREE]: {
    limits: {
      maxMeetingDurationMinutes: 60,
      attendeeLimit: 100,
      maxCohosts: 1,
      maxHosts: 1,
      gracePeriodMinutes: 5,
    },
    permissions: {
      canStreamToYoutube: false,
      canUseCohost: true,
      canRecord: false,
      canInvite: true,
      canHostMeeting: true,
      canUseWaitingRoom: true,
      canUseChat: true,
      canUseRaiseHand: true,
      canUseReactions: true,
    },
  },
  [SubscriptionPlan.PRO]: {
    limits: {
      maxMeetingDurationMinutes: null,
      attendeeLimit: 500,
      maxCohosts: 5,
      maxHosts: 1,
      gracePeriodMinutes: 0,
    },
    permissions: {
      canStreamToYoutube: true,
      canUseCohost: true,
      canRecord: true,
      canInvite: true,
      canHostMeeting: true,
      canUseWaitingRoom: true,
      canUseChat: true,
      canUseRaiseHand: true,
      canUseReactions: true,
    },
  },
  [SubscriptionPlan.ENTERPRISE]: {
    limits: {
      maxMeetingDurationMinutes: null,
      attendeeLimit: 5000,
      maxCohosts: 20,
      maxHosts: 1,
      gracePeriodMinutes: 0,
    },
    permissions: {
      canStreamToYoutube: true,
      canUseCohost: true,
      canRecord: true,
      canInvite: true,
      canHostMeeting: true,
      canUseWaitingRoom: true,
      canUseChat: true,
      canUseRaiseHand: true,
      canUseReactions: true,
    },
  },
};

export function resolvePlanPermissions(plan: SubscriptionPlan): PlanPermissions {
  return PLAN_DEFINITIONS[plan] ?? PLAN_DEFINITIONS[SubscriptionPlan.FREE];
}

export function checkPermission(
  plan: SubscriptionPlan,
  key: PermissionKey,
): boolean {
  return resolvePlanPermissions(plan).permissions[key] ?? false;
}

export function getPlanLimit(
  plan: SubscriptionPlan,
  key: keyof PlanLimits,
): number | null {
  return resolvePlanPermissions(plan).limits[key];
}

export interface MeetingDurationStatus {
  elapsedMinutes: number;
  limitMinutes: number | null;
  gracePeriodMinutes: number;
  isExpired: boolean;
  isInGracePeriod: boolean;
  remainingMinutes: number | null;
}

export function computeMeetingDurationStatus(
  startedAt: Date,
  plan: SubscriptionPlan,
  now: Date = new Date(),
): MeetingDurationStatus {
  const { maxMeetingDurationMinutes, gracePeriodMinutes } =
    resolvePlanPermissions(plan).limits;

  const elapsedMs = now.getTime() - startedAt.getTime();
  const elapsedMinutes = elapsedMs / 60000;

  if (maxMeetingDurationMinutes === null) {
    return {
      elapsedMinutes,
      limitMinutes: null,
      gracePeriodMinutes: 0,
      isExpired: false,
      isInGracePeriod: false,
      remainingMinutes: null,
    };
  }

  const totalAllowed = maxMeetingDurationMinutes + gracePeriodMinutes;
  const remainingMinutes = Math.max(0, totalAllowed - elapsedMinutes);

  return {
    elapsedMinutes,
    limitMinutes: maxMeetingDurationMinutes,
    gracePeriodMinutes,
    isExpired: elapsedMinutes >= totalAllowed,
    isInGracePeriod:
      elapsedMinutes >= maxMeetingDurationMinutes &&
      elapsedMinutes < totalAllowed,
    remainingMinutes,
  };
}
