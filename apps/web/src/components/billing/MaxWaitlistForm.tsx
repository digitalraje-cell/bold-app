'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthAwareLink } from '@/components/auth/AuthAwareLink';
import {
  MAX_DESTINATION_DEMAND_OPTIONS,
  MAX_PLAN_DISPLAY,
  MAX_WAITLIST_PLATFORM_IDS,
  STREAMING_PROVIDERS,
  isMaxPlanComingSoon,
  type MaxDestinationDemand,
  type MaxWaitlistPlatformId,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { badgeClass, cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type MaxWaitlistFormProps = {
  className?: string;
  compact?: boolean;
  onJoined?: () => void;
};

const WAITLIST_PLATFORM_OPTIONS = MAX_WAITLIST_PLATFORM_IDS.map((id) => {
  const provider = STREAMING_PROVIDERS.find((p) => p.id === id);
  return {
    id,
    name: provider?.shortName ?? id,
  };
});

export function MaxWaitlistForm({ className, compact = false, onJoined }: MaxWaitlistFormProps) {
  const { status } = useSession();
  const [selected, setSelected] = useState<MaxWaitlistPlatformId[]>([]);
  const [expectedDestinations, setExpectedDestinations] = useState<MaxDestinationDemand | null>(
    null,
  );
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedLabels = useMemo(
    () =>
      selected
        .map((id) => WAITLIST_PLATFORM_OPTIONS.find((p) => p.id === id)?.name ?? id)
        .join(', '),
    [selected],
  );

  useEffect(() => {
    if (status !== 'authenticated') {
      setChecking(false);
      return;
    }
    void api.planInterest
      .maxStatus()
      .then((data) => {
        const result = data as {
          joined?: boolean;
          requestedProviders?: string[];
          expectedDestinations?: MaxDestinationDemand | null;
          message?: string;
          foundingOffer?: string;
        };
        if (result.joined) {
          setJoined(true);
          setSelected((result.requestedProviders ?? []) as MaxWaitlistPlatformId[]);
          setExpectedDestinations(result.expectedDestinations ?? null);
          setMessage(result.foundingOffer ?? result.message ?? MAX_PLAN_DISPLAY.foundingOffer);
        }
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [status]);

  function toggleProvider(id: MaxWaitlistPlatformId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleJoin() {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);
    try {
      const result = (await api.planInterest.joinMaxWaitlist({
        requestedProviders: selected,
        expectedDestinations: expectedDestinations ?? undefined,
      })) as { joined?: boolean; message?: string; foundingOffer?: string };
      setJoined(Boolean(result.joined));
      setMessage(result.foundingOffer ?? result.message ?? MAX_PLAN_DISPLAY.foundingOffer);
      onJoined?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join waitlist');
    } finally {
      setLoading(false);
    }
  }

  if (!isMaxPlanComingSoon()) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">Max is available.</p>
        <Link
          href="/billing/upgrade"
          className="mt-3 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          View plans
        </Link>
      </div>
    );
  }

  if (checking) {
    return <p className={cn('text-sm text-muted-foreground', className)}>Loading…</p>;
  }

  if (status !== 'authenticated') {
    return (
      <div className={className}>
        <p className="text-sm font-medium text-foreground">{MAX_PLAN_DISPLAY.foundingOffer}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to join the Max waitlist and tell us which platforms matter most.
        </p>
        <AuthAwareLink
          href="/login"
          className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Sign in to join waitlist
        </AuthAwareLink>
      </div>
    );
  }

  if (joined && !compact) {
    return (
      <div className={cn(cardClass({ bordered: true }), 'p-6', className)}>
        <span className={badgeClass()}>On the waitlist</span>
        <p className="mt-3 text-sm leading-relaxed text-foreground">{message}</p>
        {selected.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Preferred platforms: {selectedLabels}
          </p>
        )}
        {expectedDestinations && (
          <p className="mt-1 text-xs text-muted-foreground">
            Expected destinations:{' '}
            {MAX_DESTINATION_DEMAND_OPTIONS.find((o) => o.id === expectedDestinations)?.label ??
              expectedDestinations}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground">{MAX_PLAN_DISPLAY.foundingOffer}</p>

      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Help us prioritize the Max launch — select your preferred platforms and streaming scale.
        </p>
      )}

      <div className={cn(compact ? 'mt-3' : 'mt-5')}>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Preferred platforms
        </p>
        <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
          {WAITLIST_PLATFORM_OPTIONS.map((provider) => {
            const active = selected.includes(provider.id);
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition',
                  active
                    ? 'border-foreground bg-background font-medium'
                    : 'border-border bg-surface hover:bg-muted/40',
                )}
              >
                {provider.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn(compact ? 'mt-4' : 'mt-5')}>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Expected destinations
        </p>
        <div className="flex flex-wrap gap-2">
          {MAX_DESTINATION_DEMAND_OPTIONS.map((option) => {
            const active = expectedDestinations === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setExpectedDestinations((prev) => (prev === option.id ? null : option.id))
                }
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition',
                  active
                    ? 'border-foreground bg-foreground font-medium text-background'
                    : 'border-border bg-surface hover:bg-muted/40',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        className={compact ? 'mt-4 w-full' : 'mt-6'}
        loading={loading}
        onClick={() => void handleJoin()}
      >
        {joined ? 'Update preferences' : 'Join Waitlist'}
      </Button>
    </div>
  );
}
