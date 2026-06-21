'use client';

import Link from 'next/link';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  PLAN_DISPLAY,
  FREE_FEATURE_LIST,
  FREE_RESTRICTIONS,
  PRO_FEATURE_LIST,
  FEATURE_COMPARISON,
} from '@boldmeet/shared';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Start free. Upgrade when you need recordings, co-hosts, and YouTube Live streaming.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <PlanCard plan={SubscriptionPlan.FREE} ctaHref="/login" ctaLabel="Start free" />
          <PlanCard
            plan={SubscriptionPlan.PRO}
            ctaHref="/login"
            ctaLabel="Upgrade to Pro"
            recommended
          />
        </div>

        <div className="mt-16 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 font-semibold">Free</th>
                <th className="px-4 py-3 font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.feature}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof row.free === 'boolean' ? (row.free ? '✓' : '—') : row.free}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof row.pro === 'boolean' ? (row.pro ? '✓' : '—') : row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  ctaHref,
  ctaLabel,
  recommended = false,
}: {
  plan: SubscriptionPlan.FREE | SubscriptionPlan.PRO;
  ctaHref: string;
  ctaLabel: string;
  recommended?: boolean;
}) {
  const display = PLAN_DISPLAY[plan];
  const price = PLAN_PRICING_INR[plan];
  const features = plan === SubscriptionPlan.FREE ? FREE_FEATURE_LIST : PRO_FEATURE_LIST;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-surface p-8',
        recommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
      )}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Recommended
        </span>
      )}
      <h3 className="text-xl font-bold">{display.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{display.tagline}</p>
      <p className="mt-6 text-4xl font-bold">
        {price === 0 ? (
          '₹0'
        ) : (
          <>
            ₹{price}
            <span className="text-base font-normal text-muted-foreground">/month</span>
          </>
        )}
      </p>
      <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-primary">✓</span>
            {feature}
          </li>
        ))}
        {plan === SubscriptionPlan.FREE &&
          FREE_RESTRICTIONS.map((item) => (
            <li key={item} className="flex gap-2 text-muted-foreground/80">
              <span>—</span>
              {item}
            </li>
          ))}
      </ul>
      <Link
        href={ctaHref}
        className={cn(
          'mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition',
          recommended
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'border border-border hover:bg-muted',
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
