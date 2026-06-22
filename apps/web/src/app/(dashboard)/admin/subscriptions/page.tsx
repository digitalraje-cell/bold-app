'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type AdminSubscription = {
  id: string;
  planName: string;
  planStatus: string;
  planStartDate: string | null;
  planExpiryDate: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  paymentStatus: string;
  paymentProvider: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
  };
};

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.admin
      .listSubscriptions(search || undefined)
      .then((res) => setItems(res as AdminSubscription[]))
      .catch(() => setError('Unable to load subscriptions.'));
  }, [search]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Subscriptions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Razorpay & Stripe readiness — payment fields stored for future activation.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 font-semibold">Customer ID</th>
              <th className="px-4 py-3 font-semibold">Subscription ID</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.user.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{item.user.email}</p>
                </td>
                <td className="px-4 py-3">{item.planName}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      item.planStatus === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-700'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.planStatus}
                  </span>
                </td>
                <td className="px-4 py-3">{item.paymentProvider || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.customerId || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.subscriptionId || '—'}</td>
                <td className="px-4 py-3">{item.paymentStatus}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.planExpiryDate
                    ? new Date(item.planExpiryDate).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
