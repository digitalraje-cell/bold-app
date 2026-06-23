'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type ProductAnalytics = {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  freeUsers: number;
  proUsers: number;
  maxWaitlist: number;
  meetingsCreated: number;
  meetingsHosted: number;
  avgMeetingDurationMinutes: number;
  pwaInstalls: number;
  featureInterestDemand: {
    waitlistTotal: number;
    conversionOpportunities: {
      proUsersOnWaitlist: number;
      freeUsersOnWaitlist: number;
      highIntentPro: number;
    };
  };
};

export default function AdminProductAnalyticsPage() {
  const [stats, setStats] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api.admin.productAnalytics()) as ProductAnalytics;
        setStats(data);
      } catch {
        setError('Unable to load product analytics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = stats
    ? [
        { label: 'Total users', value: stats.totalUsers },
        { label: 'Active users (7d)', value: stats.activeUsers7d },
        { label: 'Active users (30d)', value: stats.activeUsers30d },
        { label: 'Free users', value: stats.freeUsers },
        { label: 'Pro users', value: stats.proUsers },
        { label: 'Max waitlist', value: stats.maxWaitlist },
        { label: 'Meetings created', value: stats.meetingsCreated },
        { label: 'Meetings hosted (unique hosts)', value: stats.meetingsHosted },
        { label: 'Avg meeting duration (min)', value: stats.avgMeetingDurationMinutes },
        { label: 'PWA installs', value: stats.pwaInstalls },
        {
          label: 'High-intent Pro (waitlist)',
          value: stats.featureInterestDemand.conversionOpportunities.highIntentPro,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Analytics</h1>
          <p className="mt-1 text-muted-foreground">Founder dashboard — users, meetings, and demand.</p>
        </div>
        <Link href="/admin/feature-interest" className="text-sm font-medium underline">
          Feature interest →
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((item) => (
            <div key={item.label} className={cn(cardClass({ bordered: true }), 'p-5')}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
