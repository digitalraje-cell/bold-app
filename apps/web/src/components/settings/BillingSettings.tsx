'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SubscriptionPlan,
  PLAN_DISPLAY,
  PLAN_PRICING_INR,
} from '@boldmeet/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { cn } from '@/lib/utils';

type BillingSummary = {
  plan: SubscriptionPlan;
  subscriptionStatus: string;
  renewsAt: string | null;
  priceInr: number;
};

export function BillingSettings() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.billing
      .summary()
      .then((data) => setSummary(data as BillingSummary))
      .finally(() => setLoading(false));
  }, []);

  const plan = summary?.plan ?? SubscriptionPlan.FREE;
  const isPro = plan === SubscriptionPlan.PRO;

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
                  <span className="text-lg font-semibold">
                    {isPro
                      ? `PRO — ₹${PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month`
                      : 'FREE'}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      isPro ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {PLAN_DISPLAY[plan as SubscriptionPlan.FREE | SubscriptionPlan.PRO]?.name ?? plan}
                  </span>
                </dd>
              </div>
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
              {!isPro && (
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
