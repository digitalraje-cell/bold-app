'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isSuperAdmin } from '@boldmeet/shared';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type ReleaseRow = {
  id: string;
  version: string;
  releaseDate: string;
  releaseNotes: string[];
  forceUpdate: boolean;
};

export default function AdminReleasesPage() {
  const { data: session } = useSession();
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notesText, setNotesText] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    session?.user &&
    isSuperAdmin(session.user.role, session.user.email ?? undefined);

  useEffect(() => {
    if (!allowed) return;
    void (async () => {
      try {
        const data = (await api.admin.listReleases()) as ReleaseRow[];
        setReleases(
          data.map((r) => ({
            ...r,
            releaseNotes: Array.isArray(r.releaseNotes) ? r.releaseNotes : [],
          })),
        );
      } catch {
        setError('Unable to load releases.');
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (session && !allowed) {
    redirect('/admin');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const releaseNotes = notesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      await api.admin.createRelease({
        version: version.trim(),
        releaseDate,
        releaseNotes,
        forceUpdate,
      });
      const data = (await api.admin.listReleases()) as ReleaseRow[];
      setReleases(data);
      setVersion('');
      setNotesText('');
      setForceUpdate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create release');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Releases</h1>
      <p className="mt-1 text-muted-foreground">
        Manage version notes and force-update flags (super admin only).
      </p>

      <form onSubmit={(e) => void handleCreate(e)} className={cn(cardClass({ bordered: true }), 'mt-8 space-y-4 p-6')}>
        <div>
          <label className="mb-1 block text-sm font-medium">Version</label>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.1.0" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Release date</label>
          <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Release notes (one per line)</label>
          <textarea
            className="min-h-[120px] w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm"
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder={'PWA support\nMobile improvements'}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} />
          Force update (blocks navigation outside meetings until updated)
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" loading={saving}>
          Create release
        </Button>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Recent releases</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        ) : (
          releases.map((release) => (
            <div key={release.id} className={cn(cardClass({ bordered: true }), 'p-4')}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">v{release.version}</p>
                {release.forceUpdate && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                    Force
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(release.releaseDate).toLocaleDateString()}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {release.releaseNotes.map((note) => (
                  <li key={note}>✓ {note}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
