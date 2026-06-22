'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  mobile: string | null;
  country: string | null;
  organization: string | null;
  designation: string | null;
  plan: string;
  meetingsCreated: number;
  lastLoginAt: string | null;
  createdAt: string;
  status: string;
  isActive: boolean;
};

const FILTERS = [
  { id: 'all', label: 'All Users' },
  { id: 'free', label: 'Free Users' },
  { id: 'paid', label: 'Paid Users' },
  { id: 'active', label: 'Active Users' },
  { id: 'inactive', label: 'Inactive Users' },
] as const;

const PLANS = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params: { filter?: string; search?: string } = {};
    if (filter !== 'all') params.filter = filter;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [filter, search]);

  async function load() {
    setLoading(true);
    try {
      const data = (await api.admin.listUsers(query)) as AdminUser[];
      setUsers(data);
      setError(null);
    } catch {
      setError('Unable to load users. Super Admin access required.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  async function runAction(userId: string, action: () => Promise<unknown>) {
    setActionId(userId);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts, plans, and access.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search name, email, mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium',
              filter === item.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Profile</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Meetings</th>
                <th className="px-4 py-3 font-semibold">Last Login</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {(user.name || user.email).slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{user.designation || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p>{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.mobile || '—'}</p>
                    <p className="text-xs text-muted-foreground">{user.country || '—'}</p>
                  </td>
                  <td className="px-4 py-3">{user.organization || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-border bg-surface px-2 py-1 text-xs"
                      value={user.plan}
                      disabled={actionId === user.id}
                      onChange={(e) =>
                        void runAction(user.id, () =>
                          api.admin.changeUserPlan(user.id, e.target.value),
                        )
                      }
                    >
                      {PLANS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{user.meetingsCreated}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        user.isActive
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-red-500/10 text-red-700',
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={actionId === user.id}
                        onClick={() =>
                          void runAction(user.id, () => api.admin.deactivateUser(user.id))
                        }
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        loading={actionId === user.id}
                        onClick={() =>
                          void runAction(user.id, () => api.admin.activateUser(user.id))
                        }
                      >
                        Activate
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
