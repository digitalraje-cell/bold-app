'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type DashboardData = {
  cards: {
    totalUsers: number;
    freeUsers: number;
    paidUsers: number;
    meetingsCreated: number;
    meetingsRunning: number;
    totalParticipants: number;
    revenueInr: number;
    totalRegistrations: number;
    meetingsWithRegistration: number;
    registrationConversionRate: number;
    joinRate: number;
  };
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    subscriptionPlan: string;
    createdAt: string;
    isActive: boolean;
  }>;
  recentMeetings: Array<{
    id: string;
    meetingCode: string;
    title: string;
    hostName: string | null;
    hostEmail: string | null;
    status: string;
    createdAt: string;
    participantCount: number;
  }>;
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.admin
      .dashboard()
      .then((res) => setData(res as DashboardData))
      .catch(() => setError('Unable to load admin dashboard.'));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground">Loading dashboard…</p>;
  }

  const { cards } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={cards.totalUsers} />
        <StatCard label="Free Users" value={cards.freeUsers} />
        <StatCard label="Paid Users" value={cards.paidUsers} />
        <StatCard label="Meetings Created" value={cards.meetingsCreated} />
        <StatCard label="Meetings Running" value={cards.meetingsRunning} />
        <StatCard label="Total Participants" value={cards.totalParticipants} />
        <StatCard label="Revenue (INR)" value={`₹${cards.revenueInr.toLocaleString()}`} />
        <StatCard label="Total Registrations" value={cards.totalRegistrations} />
        <StatCard label="Meetings w/ Registration" value={cards.meetingsWithRegistration} />
        <StatCard label="Registration Conversion" value={`${cards.registrationConversionRate}%`} />
        <StatCard label="Join Rate" value={`${cards.joinRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{user.subscriptionPlan}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3">
            <Link href="/admin/users" className="text-sm text-primary hover:underline">
              View all users →
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold">Recent Meetings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Meeting</th>
                  <th className="px-4 py-2">Host</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMeetings.map((meeting) => (
                  <tr key={meeting.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{meeting.meetingCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{meeting.hostName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{meeting.hostEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          meeting.status === 'LIVE'
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {meeting.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3">
            <Link href="/admin/meetings" className="text-sm text-primary hover:underline">
              View all meetings →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
