'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type PendingPayment = {
  id: string;
  name: string;
  email: string;
  plan: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null; subscriptionPlan: string };
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = (await api.admin.listPendingPayments()) as PendingPayment[];
      setPayments(data);
    } catch {
      setError('Unable to load payments. Ensure your account has ADMIN role.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function activate(id: string) {
    setActionId(id);
    setError(null);
    try {
      await api.admin.activatePayment(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin — Payments</h1>
          <p className="mt-1 text-muted-foreground">
            Manually activate Pro after verifying Razorpay payment.
          </p>
        </div>
        <Link href="/admin/users" className="text-sm text-foreground underline-offset-4 hover:underline">
          View all users →
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground">No pending payments.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{payment.name}</p>
                    <p className="text-muted-foreground">{payment.email}</p>
                    <p className="text-xs text-muted-foreground">Current: {payment.user.subscriptionPlan}</p>
                  </td>
                  <td className="px-4 py-3">{payment.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        payment.paymentStatus === 'paid' && badgeClass(),
                        payment.paymentStatus === 'pending' && badgeClass('text-muted-foreground'),
                        payment.paymentStatus === 'activated' && badgeClass(),
                        payment.paymentStatus === 'cancelled' && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {payment.paymentStatus !== 'activated' && payment.paymentStatus !== 'cancelled' && (
                      <Button
                        size="sm"
                        loading={actionId === payment.id}
                        onClick={() => void activate(payment.id)}
                      >
                        Activate Pro
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
