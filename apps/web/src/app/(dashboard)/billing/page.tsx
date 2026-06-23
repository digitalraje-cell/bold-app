'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  FEATURE_COMPARISON,
  getPlanLabel,
  getPlanFeaturesSummary,
  shouldShowUpgradeCTA,
  isPremiumPlan,
  isSuperAdmin,
} from '@boldmeet/shared';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { PlanComparisonTable } from '@/components/ui/PlanComparisonTable';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { cardClass, ui, badgeClass } from '@/lib/ui';

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

const FAQ_ITEMS = [
  {
    question: 'How do I upgrade?',
    answer: 'Click Upgrade to Pro on this page. You will be redirected to a secure Razorpay payment link.',
  },
  {
    question: 'How is billing handled?',
    answer: 'Secure payment via Razorpay. We do not store your card details on our servers.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Contact support to cancel. Your Pro access remains active until the end of the current billing period.',
  },
  {
    question: 'What happens when Pro expires?',
    answer: 'Your account returns to the Free plan. Meeting history and account data are retained.',
  },
] as const;

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BillingPage() {
  const { data: session } = useSession();
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
  const superAdmin = isSuperAdmin(session?.user?.role, session?.user?.email);
  const showUpgrade = shouldShowUpgradeCTA(
    plan,
    session?.user?.role,
    session?.user?.email,
  );
  const planName = superAdmin ? 'Enterprise (Super Admin)' : getPlanLabel(plan);
  const isEnterprise = plan === SubscriptionPlan.ENTERPRISE || superAdmin;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className={ui.pageTitle}>Billing &amp; Plans</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription, usage, and payments.</p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Current subscription
            </h2>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
              <dl className="grid gap-4 sm:grid-cols-2 sm:gap-x-10">
                <div>
                  <dt className="text-sm text-muted-foreground">Current plan</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-semibold">{planName}</span>
                    {isEnterprise ? (
                      <span className={badgeClass()}>Unlimited</span>
                    ) : isPremiumPlan(plan) ? (
                      <span className={badgeClass()}>
                        ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/mo
                      </span>
                    ) : (
                      <span className={badgeClass('text-muted-foreground')}>₹0</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium capitalize">
                    {formatStatus(summary?.subscriptionStatus ?? 'active')}
                  </dd>
                </div>
                {isEnterprise && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">Features</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {getPlanFeaturesSummary(plan)}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">Renewal</dt>
                  <dd className="mt-1 font-medium">
                    {summary?.renewsAt
                      ? `Renews ${new Date(summary.renewsAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}`
                      : isPremiumPlan(plan)
                        ? 'Manual renewal — contact support to extend'
                        : 'No active subscription'}
                  </dd>
                </div>
              </dl>
              {showUpgrade && (
                <Link href="/billing/upgrade" className="shrink-0">
                  <Button size="lg">
                    Upgrade to Pro — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
                  </Button>
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] p-6">
            <h2 className="font-semibold">Usage this month</h2>
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

          <section className="rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] p-6">
            <h2 className="font-semibold">Free vs Pro comparison</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare what&apos;s included in each plan.
            </p>
            <PlanComparisonTable
              className="mt-4"
              columns={[
                { key: 'free', label: 'Free' },
                { key: 'pro', label: 'Pro' },
              ]}
              rows={FEATURE_COMPARISON.map((row) => ({
                feature: row.feature,
                values: { free: row.free, pro: row.pro },
              }))}
            />
          </section>

          <section className="rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] p-6">
            <h2 className="font-semibold">Payment history</h2>
            {summary?.paymentHistory?.length ? (
              <ul className="mt-4 divide-y divide-border">
                {summary.paymentHistory.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="font-medium">₹{payment.amountInr}</span>
                    <span className="text-muted-foreground">
                      {formatStatus(payment.status)} ·{' '}
                      {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No payments yet.
                {showUpgrade && (
                  <>
                    {' '}
                    <Link href="/billing/upgrade" className="text-foreground underline-offset-4 hover:underline">
                      Upgrade to Pro
                    </Link>{' '}
                    to get started.
                  </>
                )}
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] p-6">
            <h2 className="font-semibold">FAQ</h2>
            <dl className="mt-4 space-y-5">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <div key={question}>
                  <dt className="font-medium">{question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{answer}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="/settings/support" className="text-foreground underline-offset-4 hover:underline">
                Contact support
              </Link>{' '}
              or read our{' '}
              <Link href="/refund" className="text-foreground underline-offset-4 hover:underline">
                Refund Policy
              </Link>
              .
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
