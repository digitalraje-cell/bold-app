import { SubscriptionPlan } from './plans';

export const PLAN_PRICING_INR: Record<SubscriptionPlan.FREE | SubscriptionPlan.PRO, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PRO]: 299,
};

export const PLAN_DISPLAY: Record<
  SubscriptionPlan.FREE | SubscriptionPlan.PRO,
  { name: string; tagline: string; badge?: string }
> = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    tagline: 'Everything you need to run meetings',
  },
  [SubscriptionPlan.PRO]: {
    name: 'Pro',
    tagline: 'Co-hosts, YouTube Live, and advanced attendee tools',
    badge: 'Recommended',
  },
};

export const FREE_FEATURE_LIST = [
  'Meetings',
  'Chat',
  'Screen share',
  'Raise hand',
  'Reactions',
  'Single host',
] as const;

export const FREE_RESTRICTIONS = [
  'No co-hosts',
  'No recording',
  'No YouTube Live',
  'No attendee management',
] as const;

export const PRO_FEATURE_LIST = [
  'Host transfer',
  'Multiple co-hosts',
  'Attendee list',
  'Attendee comments',
  'YouTube Live integration',
  'YouTube recording',
  'Meeting analytics (Coming Soon)',
  'Recording library (Coming Soon)',
  'Webinar Mode (Coming Soon)',
] as const;

export const FEATURE_COMPARISON: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}[] = [
  { feature: 'Meetings', free: true, pro: true },
  { feature: 'Chat', free: true, pro: true },
  { feature: 'Screen share', free: true, pro: true },
  { feature: 'Raise hand & reactions', free: true, pro: true },
  { feature: 'Single host', free: true, pro: true },
  { feature: 'Host transfer', free: false, pro: true },
  { feature: 'Multiple co-hosts', free: false, pro: true },
  { feature: 'Attendee list & comments', free: false, pro: true },
  { feature: 'YouTube Live', free: false, pro: true },
  { feature: 'YouTube recording', free: false, pro: true },
  { feature: 'Meeting analytics', free: false, pro: 'Coming Soon' },
  { feature: 'Recording library', free: false, pro: 'Coming Soon' },
  { feature: 'Webinar Mode', free: false, pro: 'Coming Soon' },
];

export const MAX_FEATURE_COMPARISON_ROWS: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  max: boolean | string;
}[] = [
  ...FEATURE_COMPARISON.map((row) => ({ ...row, max: row.pro === true ? true : row.pro })),
  { feature: 'Multiple YouTube channels', free: false, pro: false, max: true },
  { feature: 'Multi-channel streaming', free: false, pro: false, max: true },
  { feature: 'Facebook Live', free: false, pro: false, max: 'Coming Soon' },
  { feature: 'Instagram Live', free: false, pro: false, max: 'Coming Soon' },
  { feature: 'LinkedIn Live', free: false, pro: false, max: 'Coming Soon' },
  { feature: 'Custom RTMP', free: false, pro: false, max: 'Coming Soon' },
  { feature: 'Advanced analytics', free: false, pro: false, max: 'Coming Soon' },
  { feature: 'Team & agency workspace', free: false, pro: false, max: 'Coming Soon' },
];
