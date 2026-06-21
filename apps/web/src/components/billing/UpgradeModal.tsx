'use client';

import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { SubscriptionPlan, PLAN_PRICING_INR, PRO_FEATURE_LIST } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold">Upgrade to Pro</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {feature
            ? `${feature} is available on the Pro plan.`
            : 'This feature is available on the Pro plan.'}
        </p>

        <p className="mt-4 text-2xl font-bold">
          ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}
          <span className="text-sm font-normal text-muted-foreground">/month</span>
        </p>

        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {PRO_FEATURE_LIST.slice(0, 6).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/billing/upgrade" className="flex-1" onClick={onClose}>
            <Button className="w-full">View plans & upgrade</Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
