'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  isVerified: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = (await api.admin.listUsers()) as AdminUser[];
      setUsers(data);
      setError(null);
    } catch {
      setError('Unable to load users. Ensure your account has ADMIN role.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function activatePro(userId: string) {
    setActionId(userId);
    setError(null);
    try {
      await api.admin.activateUserPro(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActionId(null);
    }
  }

  async function deactivatePro(userId: string) {
    setActionId(userId);
    setError(null);
    try {
      await api.admin.deactivateUserPro(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivation failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin — Users</h1>
          <p className="mt-1 text-muted-foreground">
            View users and manually activate or deactivate Pro.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin" className="text-sm text-foreground underline-offset-4 hover:underline">
            Admin overview →
          </Link>
          <Link href="/admin/payments" className="text-sm text-foreground underline-offset-4 hover:underline">
            View pending payments →
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">No users found.</p>
      ) : (
        <>
          <ul className="space-y-4 lg:hidden">
            {users.map((user) => (
              <li key={user.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{user.name || '—'}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className={badgeClass('mt-1 text-[10px] uppercase')}>Admin</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      user.subscriptionPlan === 'PRO'
                        ? badgeClass()
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {user.subscriptionPlan}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Verified</dt>
                    <dd>{user.isVerified ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
                  </div>
                  {user.subscriptionExpiresAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Expires</dt>
                      <dd>{new Date(user.subscriptionExpiresAt).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.subscriptionPlan !== 'PRO' ? (
                    <Button
                      size="sm"
                      loading={actionId === user.id}
                      onClick={() => void activatePro(user.id)}
                    >
                      Activate Pro
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={actionId === user.id}
                      onClick={() => void deactivatePro(user.id)}
                    >
                      Deactivate Pro
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Verified</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name || '—'}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className={badgeClass('mt-1 text-[10px] uppercase')}>
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        user.subscriptionPlan === 'PRO'
                          ? badgeClass()
                          : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                      )}
                    >
                      {user.subscriptionPlan}
                    </span>
                    {user.subscriptionExpiresAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expires {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{user.isVerified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.subscriptionPlan !== 'PRO' ? (
                        <Button
                          size="sm"
                          loading={actionId === user.id}
                          onClick={() => void activatePro(user.id)}
                        >
                          Activate Pro
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={actionId === user.id}
                          onClick={() => void deactivatePro(user.id)}
                        >
                          Deactivate Pro
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
