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
import { badgeClass, cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Start free. Upgrade when you need recordings, co-hosts, and YouTube Live streaming.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <PlanCard plan={SubscriptionPlan.FREE} ctaHref="/login" ctaLabel="Start free" />
          <PlanCard
            plan={SubscriptionPlan.PRO}
            ctaHref="/login"
            ctaLabel="Upgrade to Pro"
            recommended
          />
        </div>

        <div className={cn(cardClass(), 'mt-16 overflow-x-auto')}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--badge-bg)]">
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
        cardClass(),
        'relative flex flex-col p-9 sm:p-11',
        recommended && 'ring-1 ring-foreground/20 shadow-[var(--shadow-elevated)]',
      )}
    >
      {recommended && (
        <span className={cn(badgeClass('absolute -top-3 left-1/2 -translate-x-1/2'), 'text-[10px]')}>
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold">{display.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{display.tagline}</p>
      <p className="mt-8 text-4xl font-semibold tracking-tight">
        {price === 0 ? (
          '₹0'
        ) : (
          <>
            ₹{price}
            <span className="text-base font-medium text-muted-foreground">/month</span>
          </>
        )}
      </p>
      <ul className="mt-8 flex-1 space-y-3 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-foreground">✓</span>
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
          'mt-10 block rounded-full px-6 py-3.5 text-center text-sm font-semibold transition',
          recommended
            ? 'bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]'
            : 'border border-foreground/15 bg-surface text-foreground hover:bg-muted',
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
