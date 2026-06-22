'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type FeatureInterestStats = {
  maxWaitlistTotal: number;
  providerDemand: Array<{
    provider: string;
    name: string;
    status: string;
    count: number;
  }>;
  destinationDemand: Array<{ id: string; label: string; count: number }>;
  conversionOpportunities: {
    proUsersOnWaitlist: number;
    freeUsersOnWaitlist: number;
    proWantingMultiPlatform: number;
    highIntentPro: number;
    freeToProUpsell: number;
    proToMaxUpsell: number;
  };
  recentSignups: Array<{
    email: string;
    name: string | null;
    plan: string;
    requestedProviders: string[];
    expectedDestinations: string | null;
    joinedAt: string;
  }>;
};

export default function AdminFeatureInterestPage() {
  const [stats, setStats] = useState<FeatureInterestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api.admin.featureInterestStats()) as FeatureInterestStats;
        setStats(data);
      } catch {
        setError('Unable to load feature interest data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Feature Interest</h1>
      <p className="mt-1 text-muted-foreground">
        Max waitlist analytics — provider demand, destination scale, and conversion opportunities.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-sm text-destructive">{error}</p>
      ) : stats ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Waitlist signups', value: stats.maxWaitlistTotal },
              {
                label: 'Pro on waitlist',
                value: stats.conversionOpportunities.proUsersOnWaitlist,
              },
              {
                label: 'Free on waitlist',
                value: stats.conversionOpportunities.freeUsersOnWaitlist,
              },
              {
                label: 'High-intent Pro',
                value: stats.conversionOpportunities.highIntentPro,
              },
            ].map((item) => (
              <div key={item.label} className={cn(cardClass({ bordered: true }), 'p-5')}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Conversion opportunities</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: 'Free → Pro upsell',
                  value: stats.conversionOpportunities.freeToProUpsell,
                  hint: 'Free users interested in Max',
                },
                {
                  label: 'Pro → Max upsell',
                  value: stats.conversionOpportunities.proToMaxUpsell,
                  hint: 'Pro users ready for Max at launch',
                },
                {
                  label: 'Pro wanting multi-platform',
                  value: stats.conversionOpportunities.proWantingMultiPlatform,
                  hint: 'Selected non-YouTube platforms',
                },
                {
                  label: 'High-intent Pro',
                  value: stats.conversionOpportunities.highIntentPro,
                  hint: 'Multi-platform interest or 4+ destinations',
                },
              ].map((item) => (
                <div key={item.label} className={cn(cardClass({ bordered: true }), 'p-4')}>
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Provider demand</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.providerDemand.map((item) => (
                <div key={item.provider} className={cn(cardClass({ bordered: true }), 'p-4')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.name}</p>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {item.status === 'active' ? 'Live' : 'Soon'}
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Destination demand</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {stats.destinationDemand.map((item) => (
                <div key={item.id} className={cn(cardClass({ bordered: true }), 'p-4')}>
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Recent signups</h2>
            <div className="mt-4 space-y-3">
              {stats.recentSignups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No waitlist signups yet.</p>
              ) : (
                stats.recentSignups.map((signup) => (
                  <div
                    key={`${signup.email}-${signup.joinedAt}`}
                    className={cn(cardClass({ bordered: true }), 'p-4')}
                  >
                    <p className="font-medium">{signup.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {signup.plan} · {new Date(signup.joinedAt).toLocaleString()}
                    </p>
                    {signup.requestedProviders.length > 0 && (
                      <p className="mt-2 text-xs">
                        Platforms: {signup.requestedProviders.join(', ')}
                      </p>
                    )}
                    {signup.expectedDestinations && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Destinations: {signup.expectedDestinations}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
