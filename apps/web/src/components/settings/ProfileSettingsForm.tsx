'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';

type ProfileSettingsFormProps = {
  initialName: string;
  email: string;
  avatarUrl: string | null;
};

export function ProfileSettingsForm({ initialName, email, avatarUrl }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [photoUrl, setPhotoUrl] = useState(avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: photoUrl.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: { name: string } };

      if (!res.ok) {
        setError(data.error || 'Could not save profile');
        return;
      }

      await update({ name: data.user?.name ?? name.trim() });
      setMessage('Profile saved successfully.');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const previewInitial = name.trim()[0]?.toUpperCase() || email[0]?.toUpperCase() || '?';

  return (
    <SettingsShell title="Profile" description="Update your personal information.">
      <form onSubmit={handleSave} className="space-y-6">
        <SettingsCard title="Profile photo" description="Optional — paste an image URL.">
          <div className="flex items-center gap-4">
            {photoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl.trim()}
                alt=""
                className="h-16 w-16 rounded-full border border-border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background">
                {previewInitial}
              </div>
            )}
            <div className="flex-1">
              <Input
                label="Photo URL (optional)"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Personal details">
          <div className="space-y-4">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <Input
                label="Email address"
                type="email"
                value={email}
                readOnly
                disabled
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Email is verified via OTP and cannot be changed.
              </p>
            </div>
          </div>
        </SettingsCard>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
            {message}
          </p>
        )}

        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>
    </SettingsShell>
  );
}
