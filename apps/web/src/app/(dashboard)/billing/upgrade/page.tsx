'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import {
  SubscriptionPlan,
  PLAN_PRICING_INR,
  PRO_FEATURE_LIST,
  MAX_PLAN_DISPLAY,
  isMaxPlanComingSoon,
} from '@boldmeet/shared';
import { MaxWaitlistForm } from '@/components/billing/MaxWaitlistForm';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export default function UpgradePage() {
  const { data: session } = useSession();
  const { shouldShowUpgrade, isPremium } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const result = (await api.billing.createProPaymentLink()) as {
        paymentUrl?: string;
        message?: string;
      };
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      setError(result.message || 'Unable to start payment. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be started.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to billing
        </Link>
        <h1 className={cn('mt-4', ui.pageTitle)}>Upgrade to Pro</h1>
        <p className={ui.pageSubtitle}>
          Simple checkout via Razorpay. Pro is activated after payment verification.
        </p>
      </div>

      <div className={cn(cardClass(), 'relative overflow-hidden p-8 sm:p-10')}>
        <span className={cn(badgeClass(), 'absolute right-4 top-4')}>
          Early Founder Pricing — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
        </span>

        <div className={ui.iconWell}>
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold">Bold Pro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pricing may increase after the founder launch period.
        </p>

        <p className="mt-6 text-4xl font-bold">
          ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}
          <span className="text-base font-normal text-muted-foreground">/month</span>
        </p>

        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          {PRO_FEATURE_LIST.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">Paying as</p>
          <p className="text-muted-foreground">{session?.user?.name || '—'}</p>
          <p className="text-muted-foreground">{session?.user?.email}</p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6">
          {!shouldShowUpgrade ? (
            <p className="text-sm text-muted-foreground">
              Your account already has full access — no upgrade needed.
            </p>
          ) : isPremium ? (
            <p className="text-sm text-muted-foreground">You are already on the Pro plan.</p>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => void handlePay()} loading={loading}>
              Pay ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]} with Razorpay
            </Button>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          By paying you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/refund" className="underline hover:text-foreground">
            Refund Policy
          </Link>
          .
        </p>
      </div>

      {isMaxPlanComingSoon() && (
        <div className={cn(cardClass(), 'mt-8 p-8')}>
          <span className={badgeClass()}>{MAX_PLAN_DISPLAY.badge}</span>
          <h2 className="mt-4 text-lg font-semibold">{MAX_PLAN_DISPLAY.name} — multi-platform streaming</h2>
          <p className="mt-2 text-sm text-muted-foreground">{MAX_PLAN_DISPLAY.foundingOffer}</p>
          <MaxWaitlistForm className="mt-6" compact />
          <Link href="/max" className="mt-4 inline-block text-sm font-medium underline">
            View all Max features
          </Link>
        </div>
      )}
    </div>
  );
}
