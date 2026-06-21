'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SubscriptionPlan,
  PLAN_DISPLAY,
  PLAN_PRICING_INR,
  FREE_FEATURE_LIST,
  PRO_FEATURE_LIST,
} from '@boldmeet/shared';
import { api } from '@/lib/api';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type BillingSummary = {
  plan: SubscriptionPlan;
  isVerified: boolean;
  priceInr: number;
  subscriptionStatus: string;
  renewsAt: string | null;
  usage: {
    meetingsHostedThisMonth: number;
    meetingsJoinedThisMonth: number;
  };
  paymentHistory: {
    id: string;
    amountInr: number;
    status: string;
    createdAt: string;
  }[];
  razorpayConfigured: boolean;
};

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api.billing
      .summary()
      .then((data) => setSummary(data as BillingSummary))
      .catch(() => setMessage('Unable to load billing information.'))
      .finally(() => setLoading(false));
  }, []);

  const plan = summary?.plan ?? SubscriptionPlan.FREE;
  const isPro = plan === SubscriptionPlan.PRO;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing &amp; Plans</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and usage.</p>
      </div>

      {!isPro && <UpgradeBanner />}

      {message && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{PLAN_DISPLAY[plan as SubscriptionPlan.FREE | SubscriptionPlan.PRO]?.name ?? plan}</h2>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      isPro ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isPro ? 'Pro' : 'Free'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  ₹{summary?.priceInr ?? PLAN_PRICING_INR[SubscriptionPlan.FREE]}/month · Status:{' '}
                  {summary?.subscriptionStatus ?? 'active'}
                </p>
                {summary?.renewsAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Renews {new Date(summary.renewsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {!isPro && (
                <Link href="/billing/upgrade">
                  <Button>Upgrade to Pro — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/mo</Button>
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-semibold">Usage this month</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <UsageCard
                label="Meetings hosted"
                value={summary?.usage.meetingsHostedThisMonth ?? 0}
              />
              <UsageCard
                label="Meetings joined"
                value={summary?.usage.meetingsJoinedThisMonth ?? 0}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <PlanFeatures title="Free includes" features={FREE_FEATURE_LIST} />
            <PlanFeatures title="Pro includes" features={PRO_FEATURE_LIST} highlight />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-semibold">Payment history</h3>
            {summary?.paymentHistory?.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {summary.paymentHistory.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span>₹{payment.amountInr}</span>
                    <span className="text-muted-foreground">
                      {payment.status} · {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No payments yet.{' '}
                {!summary?.razorpayConfigured &&
                  'Add Razorpay credentials to enable Pro checkout.'}
              </p>
            )}
          </section>

          <p className="text-center text-sm text-muted-foreground">
            Questions?{' '}
            <Link href="/settings/profile" className="text-primary hover:underline">
              Contact support from settings
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PlanFeatures({
  title,
  features,
  highlight = false,
}: {
  title: string;
  features: readonly string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6',
        highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface',
      )}
    >
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-primary">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
