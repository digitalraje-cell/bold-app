'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { PwaAdminStats } from '@boldmeet/shared';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={cn(cardClass({ bordered: true }), 'p-6')}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PwaAdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api.pwa.adminStats()) as PwaAdminStats;
        setStats(data);
        setError(null);
      } catch {
        setError('Unable to load admin analytics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="mt-1 text-muted-foreground">PWA installation analytics and quick links.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/users" className="text-foreground underline-offset-4 hover:underline">
            Users →
          </Link>
          <Link href="/admin/payments" className="text-foreground underline-offset-4 hover:underline">
            Payments →
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading analytics…</p>
      ) : stats ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="PWA installed users" value={stats.pwaInstalledUsers} />
          <StatCard label="Installation rate" value={`${stats.installationPercentage}%`} />
        </div>
      ) : null}
    </div>
  );
}
