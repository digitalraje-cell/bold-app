'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SubscriptionPlan, PLAN_PRICING_INR } from '@boldmeet/shared';
import { usePermissions } from '@/hooks/usePermissions';
import { badgeClass, cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function UpgradeBanner({ compact = false }: { compact?: boolean }) {
  const { plan } = usePermissions();

  if (plan !== SubscriptionPlan.FREE) return null;

  if (compact) {
    return (
      <Link href="/billing/upgrade" className={cn(badgeClass(), 'gap-1.5 px-3 py-1 hover:shadow-[var(--shadow-soft)]')}>
        <Sparkles className="h-3.5 w-3.5" />
        Upgrade to Pro
      </Link>
    );
  }

  return (
    <div className={cn(cardClass({ bordered: true }), 'mb-8 p-6 sm:p-8')}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current plan: Free
          </p>
          <h2 className="mt-2 text-lg font-semibold">Unlock Pro features</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>• YouTube Recording</li>
            <li>• Multiple Co-hosts</li>
            <li>• Attendee Reports</li>
          </ul>
          <p className="mt-3 text-sm font-medium">
            Upgrade to Pro — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
          </p>
        </div>
        <Link
          href="/billing/upgrade"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-hover)]"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
