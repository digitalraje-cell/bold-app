'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import {
  MAX_FEATURE_LIST,
  MAX_HERO,
  MAX_HERO_PLATFORMS,
  MAX_PLAN_DISPLAY,
  MAX_ROADMAP_VISIBILITY,
  isMaxPlanComingSoon,
} from '@boldmeet/shared';
import { MaxWaitlistForm } from '@/components/billing/MaxWaitlistForm';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function MaxPlanPageContent() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-12 sm:pb-28 sm:pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-foreground/10 bg-gradient-to-br from-surface via-surface to-muted/40 px-8 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-foreground/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-foreground/[0.04] blur-3xl" />

        <span className={cn(badgeClass(), 'bg-foreground text-background')}>
          {MAX_PLAN_DISPLAY.badge}
        </span>

        <h1 className={cn('mx-auto mt-8 max-w-3xl', ui.pageTitle, 'text-4xl sm:text-5xl lg:text-6xl')}>
          {MAX_HERO.headline}
        </h1>

        <div className="mx-auto mt-6 max-w-md space-y-1 text-lg text-muted-foreground sm:text-xl">
          {MAX_HERO.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {MAX_HERO_PLATFORMS.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur"
            >
              {platform}
            </span>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-sm text-muted-foreground">
          {MAX_PLAN_DISPLAY.tagline}
        </p>
      </section>

      {/* Roadmap visibility */}
      <section className="mt-12">
        <h2 className="text-center text-lg font-semibold tracking-tight">Platform roadmap</h2>
        <div className={cn(cardClass(), 'mt-6 divide-y divide-border/60 overflow-hidden')}>
          {MAX_ROADMAP_VISIBILITY.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8"
            >
              <span className="font-medium">{row.name}</span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide',
                  row.status === 'available'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {row.status === 'available' ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features + waitlist */}
      <section
        className={cn(
          cardClass(),
          'relative mt-12 overflow-hidden border-foreground/10 bg-gradient-to-br from-surface via-surface to-muted/20 p-8 sm:p-12',
        )}
      >
        <div className={ui.iconWell}>
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          {MAX_PLAN_DISPLAY.name} — everything in Pro, plus
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{MAX_PLAN_DISPLAY.launchMessage}</p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {MAX_FEATURE_LIST.map((feature) => (
            <li key={feature} className="flex gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {isMaxPlanComingSoon() && (
          <div className="mt-10 border-t border-border/60 pt-10">
            <h3 className="text-lg font-semibold">Get founding pricing at launch</h3>
            <MaxWaitlistForm className="mt-5 max-w-xl" />
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Need webinar hosting and screen sharing today?{' '}
        <Link href="/billing/upgrade" className="font-medium text-foreground underline">
          Upgrade to Pro
        </Link>
      </p>
    </div>
  );
}
