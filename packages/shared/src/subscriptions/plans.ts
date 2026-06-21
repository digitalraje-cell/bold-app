/**
 * Subscription plan identifiers.
 * Add new plans here — never hardcode plan checks in business logic.
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
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
  | 'canUseReactions'
  | 'canUsePanelists'
  | 'canSwitchRoomMode'
  | 'canUseEvergreenWebinar'
  | 'canAssignModerator';

export interface PlanLimits {
  maxMeetingDurationMinutes: number | null;
  meetingAttendeeLimit: number;
  webinarAttendeeLimit: number;
  maxCohosts: number;
  maxHosts: number;
  maxPanelists: number;
  gracePeriodMinutes: number;
}

export interface PlanPermissions {
  limits: PlanLimits;
  permissions: Record<PermissionKey, boolean>;
}

const FREE_LIMITS: PlanLimits = {
  maxMeetingDurationMinutes: 60,
  meetingAttendeeLimit: 100,
  webinarAttendeeLimit: 100,
  maxCohosts: 0,
  maxHosts: 1,
  maxPanelists: 0,
  gracePeriodMinutes: 5,
};

const FREE_PERMISSIONS: Record<PermissionKey, boolean> = {
  canStreamToYoutube: false,
  canUseCohost: false,
  canRecord: false,
  canInvite: true,
  canHostMeeting: true,
  canUseWaitingRoom: true,
  canUseChat: true,
  canUseRaiseHand: true,
  canUseReactions: true,
  canUsePanelists: false,
  canSwitchRoomMode: false,
  canUseEvergreenWebinar: false,
  canAssignModerator: false,
};

export const PLAN_DEFINITIONS: Record<SubscriptionPlan, PlanPermissions> = {
  [SubscriptionPlan.FREE]: {
    limits: FREE_LIMITS,
    permissions: FREE_PERMISSIONS,
  },
  [SubscriptionPlan.STARTER]: {
    limits: {
      maxMeetingDurationMinutes: 120,
      meetingAttendeeLimit: 100,
      webinarAttendeeLimit: 250,
      maxCohosts: 2,
      maxHosts: 1,
      maxPanelists: 5,
      gracePeriodMinutes: 5,
    },
    permissions: {
      ...FREE_PERMISSIONS,
      canRecord: false,
      canUseEvergreenWebinar: false,
    },
  },
  [SubscriptionPlan.PRO]: {
    limits: {
      maxMeetingDurationMinutes: null,
      meetingAttendeeLimit: 250,
      webinarAttendeeLimit: 500,
      maxCohosts: 5,
      maxHosts: 1,
      maxPanelists: 10,
      gracePeriodMinutes: 0,
    },
    permissions: {
      ...FREE_PERMISSIONS,
      canStreamToYoutube: true,
      canUseCohost: true,
      canRecord: true,
      canUsePanelists: true,
      canSwitchRoomMode: true,
      canUseEvergreenWebinar: true,
      canAssignModerator: true,
    },
  },
  [SubscriptionPlan.BUSINESS]: {
    limits: {
      maxMeetingDurationMinutes: null,
      meetingAttendeeLimit: 500,
      webinarAttendeeLimit: 1000,
      maxCohosts: 10,
      maxHosts: 1,
      maxPanelists: 20,
      gracePeriodMinutes: 0,
    },
    permissions: {
      ...FREE_PERMISSIONS,
      canStreamToYoutube: true,
      canRecord: true,
      canUseEvergreenWebinar: true,
      canAssignModerator: true,
    },
  },
  [SubscriptionPlan.ENTERPRISE]: {
    limits: {
      maxMeetingDurationMinutes: null,
      meetingAttendeeLimit: 5000,
      webinarAttendeeLimit: 5000,
      maxCohosts: 20,
      maxHosts: 1,
      maxPanelists: 50,
      gracePeriodMinutes: 0,
    },
    permissions: {
      ...FREE_PERMISSIONS,
      canStreamToYoutube: true,
      canRecord: true,
      canUseEvergreenWebinar: true,
      canAssignModerator: true,
    },
  },
};

/** @deprecated use meetingAttendeeLimit */
export type LegacyAttendeeLimit = PlanLimits & { attendeeLimit?: number };

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

export function getAttendeeLimitForMode(
  plan: SubscriptionPlan,
  roomMode: 'MEETING' | 'WEBINAR',
): number {
  const limits = resolvePlanPermissions(plan).limits;
  return roomMode === 'WEBINAR'
    ? limits.webinarAttendeeLimit
    : limits.meetingAttendeeLimit;
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
