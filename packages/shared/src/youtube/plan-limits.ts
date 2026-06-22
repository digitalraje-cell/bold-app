import { SubscriptionPlan } from '../subscriptions/plans';
import { isMaxPlanLaunched } from '../subscriptions/max-plan';

export interface YoutubePlanLimits {
  maxChannels: number;
  maxSimultaneousDestinations: number;
  tierLabel: string;
  upgradePlanLabel: string | null;
  maxPlanComingSoon: boolean;
}

const DEFAULT_ENTERPRISE_YOUTUBE_CHANNELS = 50;

const PRO_LIMITS: Omit<YoutubePlanLimits, 'maxPlanComingSoon'> = {
  maxChannels: 1,
  maxSimultaneousDestinations: 1,
  tierLabel: 'Pro',
  upgradePlanLabel: 'Max',
};

function withComingSoonFlag(
  limits: Omit<YoutubePlanLimits, 'maxPlanComingSoon'>,
): YoutubePlanLimits {
  return { ...limits, maxPlanComingSoon: !isMaxPlanLaunched() };
}

export function getYoutubePlanLimits(
  plan: SubscriptionPlan,
  options?: { enterpriseMaxChannels?: number },
): YoutubePlanLimits {
  if (!isMaxPlanLaunched() && plan === SubscriptionPlan.BUSINESS) {
    return withComingSoonFlag(PRO_LIMITS);
  }

  switch (plan) {
    case SubscriptionPlan.PRO:
      return withComingSoonFlag(PRO_LIMITS);
    case SubscriptionPlan.BUSINESS:
      return withComingSoonFlag({
        maxChannels: 5,
        maxSimultaneousDestinations: 5,
        tierLabel: 'Max',
        upgradePlanLabel: null,
      });
    case SubscriptionPlan.ENTERPRISE:
      return withComingSoonFlag({
        maxChannels: options?.enterpriseMaxChannels ?? DEFAULT_ENTERPRISE_YOUTUBE_CHANNELS,
        maxSimultaneousDestinations:
          options?.enterpriseMaxChannels ?? DEFAULT_ENTERPRISE_YOUTUBE_CHANNELS,
        tierLabel: 'Enterprise',
        upgradePlanLabel: null,
      });
    default:
      return withComingSoonFlag({
        maxChannels: 0,
        maxSimultaneousDestinations: 0,
        tierLabel: 'Free',
        upgradePlanLabel: 'Pro',
      });
  }
}

export function canConnectYoutubeChannel(
  plan: SubscriptionPlan,
  currentChannelCount: number,
  enterpriseMaxChannels?: number,
): boolean {
  const limits = getYoutubePlanLimits(plan, { enterpriseMaxChannels });
  return limits.maxChannels > 0 && currentChannelCount < limits.maxChannels;
}
