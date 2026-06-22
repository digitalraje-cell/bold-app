'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  PLAN_DISPLAY,
  FREE_FEATURE_LIST,
  FREE_RESTRICTIONS,
  PRO_FEATURE_LIST,
  FEATURE_COMPARISON,
} from '@boldmeet/shared';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ui.eyebrow}>Pricing</p>
          <h2 className={cn('mt-6', ui.sectionTitle, 'sm:text-4xl')}>Simple, transparent pricing</h2>
          <p className={cn(ui.sectionSubtitle, 'sm:text-lg')}>
            Start free. Upgrade when you need recordings, co-hosts, and YouTube Live streaming.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <PlanCard plan={SubscriptionPlan.FREE} ctaHref="/login" ctaLabel="Start free" />
          <PlanCard
            plan={SubscriptionPlan.PRO}
            ctaHref="/login"
            ctaLabel="Upgrade to Pro"
            recommended
          />
        </div>

        <div className={cn(cardClass(), 'mt-12 p-8 sm:p-10')}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className={badgeClass()}>Early Founder Pricing</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                Lock in ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month before prices increase
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Founder launch pricing includes priority access to new features, YouTube recording,
                co-hosts, and advanced attendee management.
              </p>
            </div>
            <Link href="/billing/upgrade" className="shrink-0">
              <span className="inline-flex rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-hover)]">
                Upgrade to Pro
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="mb-6 text-center text-lg font-semibold tracking-tight">
            Compare plans
          </h3>
          <div className={cn(cardClass(), 'overflow-x-auto')}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[var(--badge-bg)]">
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold">Free</th>
                  <th className="px-6 py-4 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/80 last:border-0">
                    <td className="px-6 py-4 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {typeof row.free === 'boolean' ? (row.free ? '✓' : '—') : row.free}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {typeof row.pro === 'boolean' ? (row.pro ? '✓' : '—') : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        cardClass({ interactive: recommended }),
        'relative flex flex-col p-9 sm:p-11',
        recommended && 'ring-1 ring-foreground/15',
      )}
    >
      {recommended && (
        <span className={cn(badgeClass('absolute -top-3 left-1/2 -translate-x-1/2'), 'text-[10px]')}>
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold">{display.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{display.tagline}</p>
      <p className="mt-10 text-5xl font-semibold tracking-tight">
        {price === 0 ? (
          '₹0'
        ) : (
          <>
            ₹{price}
            <span className="text-base font-medium text-muted-foreground">/month</span>
          </>
        )}
      </p>
      <ul className="mt-10 flex-1 space-y-3.5 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            {feature}
          </li>
        ))}
        {plan === SubscriptionPlan.FREE &&
          FREE_RESTRICTIONS.map((item) => (
            <li key={item} className="flex gap-3 text-muted-foreground/70">
              <span className="w-4 shrink-0 text-center">—</span>
              {item}
            </li>
          ))}
      </ul>
      <Link
        href={ctaHref}
        className={cn(
          'mt-12 block rounded-full px-6 py-3.5 text-center text-sm font-semibold transition',
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
