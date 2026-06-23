'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  getPlanLabel,
  getPlanFeaturesSummary,
  shouldShowUpgradeCTA,
  isPremiumPlan,
} from '@boldmeet/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type BillingSummary = {
  plan: SubscriptionPlan;
  subscriptionStatus: string;
  renewsAt: string | null;
  priceInr: number;
};

export function BillingSettings() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.billing
      .summary()
      .then((data) => setSummary(data as BillingSummary))
      .finally(() => setLoading(false));
  }, []);

  const plan = summary?.plan ?? SubscriptionPlan.FREE;
  const showUpgrade = shouldShowUpgradeCTA(
    plan,
    session?.user?.role,
    session?.user?.email,
  );

  return (
    <SettingsShell title="Billing" description="Your subscription and renewal status.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading billing…</p>
      ) : (
        <div className="space-y-6">
          <SettingsCard title="Subscription">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Current plan</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-semibold">{getPlanLabel(plan)}</span>
                  <span
                    className={cn(
                      badgeClass(),
                      !isPremiumPlan(plan) && 'text-muted-foreground',
                    )}
                  >
                    {plan === SubscriptionPlan.ENTERPRISE
                      ? 'Unlimited'
                      : isPremiumPlan(plan)
                        ? `₹${PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month`
                        : 'Free'}
                  </span>
                </dd>
              </div>
              {plan === SubscriptionPlan.ENTERPRISE && (
                <div>
                  <dt className="text-muted-foreground">Features</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {getPlanFeaturesSummary(plan)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Renewal status</dt>
                <dd className="mt-1 font-medium capitalize">
                  {summary?.subscriptionStatus ?? 'active'}
                  {summary?.renewsAt && (
                    <span className="text-muted-foreground">
                      {' '}
                      · Renews {new Date(summary.renewsAt).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {showUpgrade && (
                <Link href="/billing/upgrade">
                  <Button>
                    Upgrade to Pro — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
                  </Button>
                </Link>
              )}
              <Link href="/billing">
                <Button variant="secondary">Open billing page</Button>
              </Link>
            </div>
          </SettingsCard>
        </div>
      )}
    </SettingsShell>
  );
}
