'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { getProfileCompletionPercent } from '@boldmeet/shared';

type HostProfileModalProps = {
  open: boolean;
  initial?: {
    name?: string | null;
    mobile?: string | null;
    organization?: string | null;
    designation?: string | null;
    country?: string | null;
    website?: string | null;
    linkedInUrl?: string | null;
    avatarUrl?: string | null;
  };
  onComplete: () => void;
};

export function HostProfileModal({ open, initial, onComplete }: HostProfileModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [mobile, setMobile] = useState(initial?.mobile ?? '');
  const [organization, setOrganization] = useState(initial?.organization ?? '');
  const [designation, setDesignation] = useState(initial?.designation ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [linkedInUrl, setLinkedInUrl] = useState(initial?.linkedInUrl ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setMobile(initial?.mobile ?? '');
    setOrganization(initial?.organization ?? '');
    setDesignation(initial?.designation ?? '');
    setCountry(initial?.country ?? '');
    setWebsite(initial?.website ?? '');
    setLinkedInUrl(initial?.linkedInUrl ?? '');
    setAvatarUrl(initial?.avatarUrl ?? '');
  }, [open, initial]);

  if (!open) return null;

  const completion = getProfileCompletionPercent({
    name,
    mobile,
    country,
    organization,
    designation,
    avatarUrl,
    website,
    linkedInUrl,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.users.updateProfile({
        name,
        mobile,
        organization,
        designation,
        country: country || undefined,
        website: website || undefined,
        linkedInUrl: linkedInUrl || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-xl font-bold">Complete your Host Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Required before you can create your first meeting.
        </p>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Profile completion</span>
            <span>{completion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          <Input
            label="Organization / Company"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
          />
          <Input
            label="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
          />
          <Input label="Country (optional)" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label="Profile photo URL (optional)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <Input label="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Input label="LinkedIn URL (optional)" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} />
          <Button type="submit" className="w-full" loading={loading}>
            Save & continue
          </Button>
        </form>
      </div>
    </div>
  );
}
