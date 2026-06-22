'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { getProfileCompletionPercent } from '@boldmeet/shared';

export default function SignupCompletePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/signup/complete');
      return;
    }
    if (status !== 'authenticated') return;

    void api.users
      .me()
      .then((profile) => {
        const p = profile as {
          name?: string | null;
          avatarUrl?: string | null;
          signupProfileComplete?: boolean;
          profile?: {
            mobile?: string | null;
            country?: string | null;
            organization?: string | null;
            designation?: string | null;
            website?: string | null;
            linkedInUrl?: string | null;
          };
        };
        if (p.signupProfileComplete) {
          router.replace('/dashboard');
          return;
        }
        setName(p.name ?? '');
        setAvatarUrl(p.avatarUrl ?? '');
        setMobile(p.profile?.mobile ?? '');
        setCountry(p.profile?.country ?? '');
        setOrganization(p.profile?.organization ?? '');
        setDesignation(p.profile?.designation ?? '');
        setWebsite(p.profile?.website ?? '');
        setLinkedInUrl(p.profile?.linkedInUrl ?? '');
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [status, router]);

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
    setSaving(true);
    setError('');
    try {
      await api.users.updateProfile({
        name,
        mobile,
        country,
        organization,
        designation,
        avatarUrl: avatarUrl || undefined,
        website: website || undefined,
        linkedInUrl: linkedInUrl || undefined,
      });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading || status === 'loading') {
    return <p className="mx-auto max-w-lg py-16 text-center text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <h1 className="text-2xl font-bold">Complete your profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us a bit about yourself to finish setting up BoldMeet.
      </p>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Profile completion</span>
          <span>{completion}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          value={session?.user?.email ?? ''}
          disabled
          readOnly
        />
        <Input label="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
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
        <Input
          label="Profile photo URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <Input label="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <Input
          label="LinkedIn URL (optional)"
          value={linkedInUrl}
          onChange={(e) => setLinkedInUrl(e.target.value)}
        />
        <Button type="submit" className="w-full" size="lg" loading={saving}>
          Continue to dashboard
        </Button>
      </form>
    </div>
  );
}
