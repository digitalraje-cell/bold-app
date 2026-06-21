'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SubscriptionPlan, PLAN_PRICING_INR } from '@boldmeet/shared';
import { usePermissions } from '@/hooks/usePermissions';

export function UpgradeBanner({ compact = false }: { compact?: boolean }) {
  const { plan } = usePermissions();

  if (plan !== SubscriptionPlan.FREE) return null;

  if (compact) {
    return (
      <Link
        href="/billing"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Upgrade to Pro
      </Link>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Current plan: Free
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Unlock recordings, co-hosts, and YouTube Live for ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Pro for meeting history, attendee reports, and streaming to your channel.
          </p>
        </div>
        <Link
          href="/billing"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
