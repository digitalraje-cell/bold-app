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
    tagline: 'Recordings, co-hosts, and YouTube Live',
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
  'Host transfer',
] as const;

export const PRO_FEATURE_LIST = [
  'Everything in Free',
  'Multiple co-hosts',
  'Attendee list & reports',
  'Attendee comments',
  'Meeting history',
  'Recording support',
  'YouTube Live streaming',
  'Future webinar features',
] as const;

export const FEATURE_COMPARISON: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}[] = [
  { feature: 'HD meetings', free: true, pro: true },
  { feature: 'Chat', free: true, pro: true },
  { feature: 'Screen share', free: true, pro: true },
  { feature: 'Raise hand & reactions', free: true, pro: true },
  { feature: 'Host transfer', free: true, pro: true },
  { feature: 'Co-hosts', free: '1 host only', pro: 'Up to 5' },
  { feature: 'Meeting recordings', free: false, pro: true },
  { feature: 'YouTube Live', free: false, pro: true },
  { feature: 'Meeting history & reports', free: 'Basic', pro: 'Full' },
  { feature: 'Webinar mode (preview)', free: false, pro: 'Coming soon' },
];
