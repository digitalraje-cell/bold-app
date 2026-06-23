'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { AuthAwareLink } from '@/components/auth/AuthAwareLink';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  PLAN_DISPLAY,
  FREE_FEATURE_LIST,
  FREE_RESTRICTIONS,
  PRO_FEATURE_LIST,
  MAX_FEATURE_LIST,
  MAX_PLAN_DISPLAY,
  MAX_FEATURE_COMPARISON_ROWS,
  isMaxPlanComingSoon,
} from '@boldmeet/shared';
import { PlanComparisonTable } from '@/components/ui/PlanComparisonTable';
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
            Start free on Pro when you need webinar hosting and screen sharing. Cloud recording and
            multi-platform streaming are launching soon.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3 lg:gap-6">
          <PlanCard plan={SubscriptionPlan.FREE} ctaHref="/login" ctaLabel="Start a Meeting" />
          <PlanCard
            plan={SubscriptionPlan.PRO}
            ctaHref="/login"
            ctaLabel="Upgrade to Pro"
            recommended
          />
          <MaxPlanCard />
        </div>

        <div className={cn(cardClass(), 'mt-12 p-8 sm:p-10')}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className={badgeClass()}>Early Founder Pricing</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                Lock in ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month before prices increase
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Founder launch pricing includes webinar hosting, screen sharing, and co-host tools. Max
                waitlist members get early access to multi-platform streaming.
              </p>
            </div>
            <Link href="/billing/upgrade" className="shrink-0">
              <span className="inline-flex rounded-full bg-[var(--primary-gradient)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:shadow-[var(--primary-glow)]">
                Upgrade to Pro
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="mb-6 text-center text-lg font-semibold tracking-tight">Compare plans</h3>
          <PlanComparisonTable
            columns={[
              { key: 'free', label: 'Free' },
              { key: 'pro', label: 'Pro' },
              { key: 'max', label: 'Max' },
            ]}
            rows={MAX_FEATURE_COMPARISON_ROWS.map((row) => ({
              feature: row.feature,
              values: { free: row.free, pro: row.pro, max: row.max },
            }))}
          />
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
        'relative flex flex-col p-9 sm:p-10',
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
      <AuthAwareLink
        href={ctaHref}
        className={cn(
          'mt-12 block rounded-full px-6 py-3.5 text-center text-sm font-semibold transition',
          recommended
            ? 'bg-[var(--primary-gradient)] text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--primary-glow)]'
            : 'border border-[var(--accent-purple)]/35 bg-surface text-[var(--accent-purple-dark)] hover:bg-[var(--badge-bg)]',
        )}
      >
        {ctaLabel}
      </AuthAwareLink>
    </div>
  );
}

function MaxPlanCard() {
  return (
    <div
      className={cn(
        cardClass(),
        'relative flex flex-col overflow-hidden border-foreground/10 bg-gradient-to-br from-surface via-surface to-muted/40 p-9 sm:p-10',
      )}
    >
      <span
        className={cn(
          badgeClass('absolute right-4 top-4'),
          'bg-foreground text-background text-[10px]',
        )}
      >
        {MAX_PLAN_DISPLAY.badge}
      </span>
      <h3 className="text-xl font-semibold">{MAX_PLAN_DISPLAY.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{MAX_PLAN_DISPLAY.tagline}</p>
      <p className="mt-10 text-3xl font-semibold tracking-tight text-muted-foreground">
        {isMaxPlanComingSoon() ? 'Coming Soon' : 'Contact us'}
      </p>
      <ul className="mt-10 flex-1 space-y-3 text-sm text-muted-foreground">
        {MAX_FEATURE_LIST.slice(0, 6).map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            {feature}
          </li>
        ))}
        <li className="text-xs text-muted-foreground/80">+ more on launch</li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">{MAX_PLAN_DISPLAY.foundingOffer}</p>
      <Link
        href="/max"
        className="mt-10 block rounded-full border border-foreground/20 bg-foreground px-6 py-3.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
      >
        {isMaxPlanComingSoon() ? 'Join Waitlist' : 'Learn more'}
      </Link>
    </div>
  );
}
