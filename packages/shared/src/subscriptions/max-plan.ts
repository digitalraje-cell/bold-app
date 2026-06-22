import { SubscriptionPlan } from './plans';

/** MAX (BUSINESS) is visible but not purchasable until multi-platform streaming ships. */
export function isMaxPlanLaunched(): boolean {
  const serverFlag =
    typeof process !== 'undefined' ? process.env.MAX_PLAN_ENABLED : undefined;
  const clientFlag =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAX_PLAN_ENABLED : undefined;
  return serverFlag === 'true' || clientFlag === 'true';
}

export function isMaxPlanComingSoon(): boolean {
  return !isMaxPlanLaunched();
}

/** @deprecated use isMaxPlanComingSoon() */
export const MAX_PLAN_COMING_SOON = true;

export const MAX_PLAN_DISPLAY = {
  name: 'Max',
  tagline: 'For creators, coaches, agencies and broadcasters.',
  badge: 'Coming Soon',
  launchMessage: 'Launching Soon',
  earlyAdopterMessage:
    'Join the waitlist and lock in founding pricing when MAX launches.',
  foundingOffer:
    'Join the waitlist and lock in founding pricing when MAX launches.',
} as const;

export const MAX_HERO = {
  headline: 'Broadcast Everywhere From One Meeting',
  lines: ['One meeting.', 'Multiple platforms.', 'Unlimited reach.'],
} as const;

/** Platforms shown in the Max hero value proposition */
export const MAX_HERO_PLATFORMS = [
  'YouTube',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'Custom RTMP',
] as const;

/** Roadmap status rows for the Max page */
export const MAX_ROADMAP_VISIBILITY = [
  { name: 'YouTube Live', status: 'available' as const },
  { name: 'Facebook Live', status: 'coming_soon' as const },
  { name: 'Instagram Live', status: 'coming_soon' as const },
  { name: 'LinkedIn Live', status: 'coming_soon' as const },
  { name: 'Custom RTMP', status: 'coming_soon' as const },
] as const;

export const MAX_DESTINATION_DEMAND_OPTIONS = [
  { id: '2-3', label: '2–3 destinations' },
  { id: '4-5', label: '4–5 destinations' },
  { id: '6+', label: '6+ destinations' },
] as const;

export type MaxDestinationDemand =
  (typeof MAX_DESTINATION_DEMAND_OPTIONS)[number]['id'];

export const MAX_WAITLIST_PLATFORM_IDS = [
  'youtube',
  'facebook',
  'instagram',
  'linkedin',
  'twitch',
  'x',
  'custom_rtmp',
] as const;

export type MaxWaitlistPlatformId = (typeof MAX_WAITLIST_PLATFORM_IDS)[number];

export function isMaxWaitlistPlatformId(value: string): value is MaxWaitlistPlatformId {
  return (MAX_WAITLIST_PLATFORM_IDS as readonly string[]).includes(value);
}

export function isMaxDestinationDemand(value: string): value is MaxDestinationDemand {
  return MAX_DESTINATION_DEMAND_OPTIONS.some((o) => o.id === value);
}

export const MAX_FEATURE_LIST = [
  'Multiple YouTube Channels',
  'Simultaneous Multi-Channel Streaming',
  'Facebook Live',
  'Instagram Live',
  'LinkedIn Live',
  'Custom RTMP',
  'Multi-Destination Broadcasting',
  'Advanced Analytics',
  'Team Management',
  'Agency Workspace',
  'White Label Features',
] as const;

export const PRO_PLAN_SUMMARY = {
  name: 'Pro',
  tagline: 'YouTube Live, co-hosts, and webinar tools for growing hosts.',
  features: [
    '1 Connected YouTube Channel',
    'YouTube Live',
    'Browser meetings',
    'Registration forms',
    'Webinar features',
  ],
} as const;

export const FREE_PLAN_SUMMARY = {
  name: 'Free',
  tagline: 'Meetings and basic collaboration.',
  features: ['Meetings', 'Basic features', 'No livestreaming'],
} as const;

/** Maps internal BUSINESS enum to user-facing Max label. */
export function resolveMaxPlanLabel(plan: SubscriptionPlan): string {
  if (plan === SubscriptionPlan.BUSINESS) return MAX_PLAN_DISPLAY.name;
  return plan;
}
