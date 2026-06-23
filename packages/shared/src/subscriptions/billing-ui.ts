import { SubscriptionPlan } from './plans';
import { resolveEffectivePlan, isSuperAdmin } from '../admin/roles';

/** Plans that include paid / Pro-tier product features (no upgrade CTAs). */
export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return plan !== SubscriptionPlan.FREE;
}

export function shouldShowUpgradeCTA(
  plan: SubscriptionPlan,
  role?: string | null,
  email?: string | null,
): boolean {
  if (isSuperAdmin(role, email)) return false;
  const effective = resolveEffectivePlan(role ?? null, plan, email);
  return effective === SubscriptionPlan.FREE;
}

export function getPlanLabel(plan: SubscriptionPlan): string {
  switch (plan) {
    case SubscriptionPlan.ENTERPRISE:
      return 'Enterprise';
    case SubscriptionPlan.BUSINESS:
      return 'Business';
    case SubscriptionPlan.PRO:
      return 'Pro';
    case SubscriptionPlan.STARTER:
      return 'Starter';
    default:
      return 'Free';
  }
}

export function getPlanFeaturesSummary(plan: SubscriptionPlan): string {
  switch (plan) {
    case SubscriptionPlan.ENTERPRISE:
      return 'Unlimited meetings, co-hosts, YouTube Live, and admin tools';
    case SubscriptionPlan.BUSINESS:
      return 'Advanced meetings, co-hosts, and YouTube Live';
    case SubscriptionPlan.PRO:
      return 'Co-hosts, YouTube Live, and attendee management';
    case SubscriptionPlan.STARTER:
      return 'Extended meeting limits';
    default:
      return 'Core meetings and chat';
  }
}
