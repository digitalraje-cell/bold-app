'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, Sparkles } from 'lucide-react';
import { SubscriptionPlan, PLAN_PRICING_INR } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { cn } from '@/lib/utils';

type AccountSettingsProps = {
  plan: string;
  createdAt: string;
  isVerified: boolean;
};

export function AccountSettings({ plan, createdAt, isVerified }: AccountSettingsProps) {
  const isPro = plan === SubscriptionPlan.PRO;
  const createdLabel = new Date(createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SettingsShell
      title="Account"
      description="Your plan, email status, and account actions."
    >
      <div className="space-y-6">
        <SettingsCard title="Account status">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email status</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    isVerified
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                  )}
                >
                  {isVerified ? 'Verified' : 'Not verified'}
                </span>
                {!isVerified && (
                  <p className="mt-2 text-muted-foreground">
                    Verify your email to host meetings.{' '}
                    <Link href="/verify" className="text-primary hover:underline">
                      Verify now
                    </Link>
                  </p>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Current plan</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {isPro ? 'Pro' : 'Free'}
                </span>
                {isPro && (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    PRO — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account created</dt>
              <dd className="mt-1 font-medium">{createdLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sign-in method</dt>
              <dd className="mt-1 font-medium">Email OTP</dd>
            </div>
          </dl>
        </SettingsCard>

        <SettingsCard title="Actions">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!isPro && (
              <Link href="/billing/upgrade">
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <Link href="/billing">
              <Button variant="secondary">Billing</Button>
            </Link>
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SettingsCard>
      </div>
    </SettingsShell>
  );
}
