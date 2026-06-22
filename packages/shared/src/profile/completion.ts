export const SIGNUP_REQUIRED_FIELDS = [
  'name',
  'mobile',
  'country',
  'organization',
  'designation',
] as const;

export const HOST_REQUIRED_FIELDS = [
  'name',
  'mobile',
  'organization',
  'designation',
] as const;

export type ProfileCompletionTier = 25 | 50 | 75 | 100;

export interface ProfileCompletionInput {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  country?: string | null;
  organization?: string | null;
  designation?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  linkedInUrl?: string | null;
}

function isFilled(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function isSignupProfileComplete(input: ProfileCompletionInput): boolean {
  return (
    isFilled(input.name) &&
    isFilled(input.mobile) &&
    isFilled(input.country) &&
    isFilled(input.organization) &&
    isFilled(input.designation)
  );
}

export function isHostProfileComplete(input: ProfileCompletionInput): boolean {
  return (
    isFilled(input.name) &&
    isFilled(input.mobile) &&
    isFilled(input.organization) &&
    isFilled(input.designation)
  );
}

/** Profile completion buckets: 25 / 50 / 75 / 100 */
export function getProfileCompletionPercent(
  input: ProfileCompletionInput,
): ProfileCompletionTier {
  const trackable = [
    isFilled(input.name),
    isFilled(input.mobile),
    isFilled(input.country),
    isFilled(input.organization),
    isFilled(input.designation),
    isFilled(input.avatarUrl),
    isFilled(input.website),
    isFilled(input.linkedInUrl),
  ];
  const filled = trackable.filter(Boolean).length;

  if (filled >= 7) return 100;
  if (filled >= 5) return 75;
  if (filled >= 3) return 50;
  return 25;
}

export const PAID_PLANS = ['STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const;

export function isPaidPlan(plan: string): boolean {
  return (PAID_PLANS as readonly string[]).includes(plan);
}
