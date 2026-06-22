'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RegistrationFormBuilderModal } from '@/components/meeting/RegistrationFormBuilderModal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createDefaultRegistrationFormConfig,
  type RegistrationFormConfig,
} from '@boldmeet/shared';

type RegistrationRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  designation: string | null;
  status: string;
  createdAt: string;
};

export default function MeetingRegistrationsPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig>(
    createDefaultRegistrationFormConfig(),
  );
  const [savingForm, setSavingForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [list, form] = await Promise.all([
        api.meetings.registration.list(meetingId),
        api.meetings.registration.getForm(meetingId),
      ]);
      setRows(list as RegistrationRow[]);
      setFormConfig(form as RegistrationFormConfig);
      setError(null);
    } catch {
      setError('Unable to load registrations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [meetingId]);

  async function updateStatus(id: string, status: string) {
    setActionId(id);
    try {
      await api.meetings.registration.updateStatus(meetingId, id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionId(null);
    }
  }

  async function saveForm(config: RegistrationFormConfig) {
    setSavingForm(true);
    try {
      await api.meetings.registration.saveForm(meetingId, config);
      setFormConfig(config);
      setShowBuilder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save form');
    } finally {
      setSavingForm(false);
    }
  }

  async function downloadExport(format: 'csv' | 'excel') {
    const tokenRes = await fetch('/api/token');
    const { token } = (await tokenRes.json()) as { token?: string };
    const url = api.meetings.registration.exportUrl(meetingId, format);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError('Export failed');
      return;
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = format === 'excel' ? 'registrations.xls' : 'registrations.csv';
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review attendee registrations and manage approval status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowBuilder(true)}>
            Configure form
          </Button>
          <Button variant="secondary" onClick={() => void downloadExport('csv')}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => void downloadExport('excel')}>
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <RegistrationFormBuilderModal
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={saveForm}
        initialConfig={formConfig}
        saving={savingForm}
      />

      {loading ? (
        <p className="text-muted-foreground">Loading registrations…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Designation</th>
                <th className="px-4 py-3 font-semibold">Registration Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No registrations yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.phone || '—'}</td>
                    <td className="px-4 py-3">{row.company || '—'}</td>
                    <td className="px-4 py-3">{row.designation || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          row.status === 'APPROVED' || row.status === 'JOINED'
                            ? 'bg-green-500/10 text-green-700'
                            : row.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-700'
                              : row.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-700'
                                : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              loading={actionId === row.id}
                              onClick={() => void updateStatus(row.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionId === row.id}
                              onClick={() => void updateStatus(row.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
