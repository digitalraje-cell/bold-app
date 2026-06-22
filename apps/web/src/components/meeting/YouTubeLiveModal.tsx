'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MeetingBroadcastProviderType,
  isMaxPlanComingSoon,
  type YouTubeChannelAccount,
  type YouTubeConnectionStatus,
  type YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { GoLiveComingSoonDestinations } from '@/components/meeting/GoLiveComingSoonDestinations';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { StartLiveStreamParams } from '@/hooks/useYouTubeLiveStream';

interface YouTubeLiveModalProps {
  open: boolean;
  meetingId: string;
  loading?: boolean;
  onClose: () => void;
  onStart: (params: StartLiveStreamParams) => Promise<unknown>;
}

export function YouTubeLiveModal({
  open,
  loading,
  onClose,
  onStart,
}: YouTubeLiveModalProps) {
  const [connection, setConnection] = useState<YouTubeConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<YouTubePrivacyStatus>('unlisted');
  const [error, setError] = useState('');

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);
    try {
      const status = (await api.youtube.status(false)) as YouTubeConnectionStatus;
      setConnection(status);
      const eligible = (status.accounts ?? []).filter(
        (a) => a.status === 'live_enabled' || a.liveStreamingEnabled,
      );
      const maxDest = status.limits?.maxSimultaneousDestinations ?? 1;
      setSelectedAccountIds((prev) => {
        const kept = prev.filter((id) => eligible.some((a) => a.id === id));
        if (kept.length > 0) return kept.slice(0, maxDest);
        if (maxDest === 1 && eligible[0]) return [eligible[0].id];
        return [];
      });
    } catch {
      setConnection(null);
      setError('Could not load your connected YouTube channels.');
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    void loadConnection();
  }, [open, loadConnection]);

  const accounts = useMemo(
    () => (connection?.accounts ?? []).filter((a) => a.status === 'live_enabled' || a.liveStreamingEnabled),
    [connection],
  );
  const allAccounts = connection?.accounts ?? [];
  const limits = connection?.limits;
  const multiSelect =
    !isMaxPlanComingSoon() && (limits?.maxSimultaneousDestinations ?? 1) > 1;
  const selectedAccounts = accounts.filter((a) => selectedAccountIds.includes(a.id));

  function toggleAccount(accountId: string) {
    const maxDest = limits?.maxSimultaneousDestinations ?? 1;
    if (!multiSelect) {
      setSelectedAccountIds([accountId]);
      return;
    }
    setSelectedAccountIds((prev) => {
      if (prev.includes(accountId)) {
        return prev.filter((id) => id !== accountId);
      }
      if (prev.length >= maxDest) return prev;
      return [...prev, accountId];
    });
  }

  async function handleGoLive(e: React.FormEvent) {
    e.preventDefault();
    if (selectedAccountIds.length === 0) return;
    setError('');
    try {
      await onStart({
        provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
        youtubeAccountIds: selectedAccountIds,
        visibility,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start YouTube Live');
    }
  }

  function renderChannelOption(account: YouTubeChannelAccount) {
    const selected = selectedAccountIds.includes(account.id);
    return (
      <button
        key={account.id}
        type="button"
        onClick={() => toggleAccount(account.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition',
          selected
            ? 'border-foreground bg-background font-medium text-foreground'
            : 'border-border bg-surface text-foreground hover:bg-muted/50',
        )}
      >
        {multiSelect ? (
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              selected ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground',
            )}
          >
            {selected && <span className="text-[10px] font-bold">✓</span>}
          </span>
        ) : (
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              selected ? 'border-foreground' : 'border-muted-foreground',
            )}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-foreground" />}
          </span>
        )}
        {account.channelAvatar ? (
          <img src={account.channelAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : null}
        <span className="flex-1 truncate">{account.name}</span>
      </button>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] bg-surface p-8 shadow-[var(--shadow-elevated)]">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Go Live on YouTube</h2>

        {connectionLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading your channels…</p>
        ) : accounts.length === 0 ? (
          <div className="mt-5 space-y-4">
            {allAccounts.length > 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your connected channels need live streaming activation before you can go live.
                Enable live streaming in Settings → Connected Channels.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Connect a YouTube channel in Settings first. You only sign in once — then go live
                from any meeting with one click.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Link
                href="/settings/integrations"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                onClick={onClose}
              >
                {allAccounts.length > 0 ? 'Manage Channels' : 'Connect Channel'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {multiSelect ? 'Stream to channels' : 'YouTube channel'}
              </p>
              <div className="space-y-2">{accounts.map(renderChannelOption)}</div>
              {multiSelect && limits && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Select up to {limits.maxSimultaneousDestinations} channels to stream simultaneously.
                </p>
              )}
            </div>

            <form onSubmit={(e) => void handleGoLive(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="youtube-visibility"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Visibility
                </label>
                <select
                  id="youtube-visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as YouTubePrivacyStatus)}
                  className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                Title and description are set from this meeting automatically.
              </p>
            </form>

            {isMaxPlanComingSoon() && <GoLiveComingSoonDestinations className="mt-2" />}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                loading={loading}
                disabled={selectedAccounts.length === 0}
                onClick={(e) => void handleGoLive(e as unknown as React.FormEvent)}
              >
                Go Live
                {selectedAccounts.length > 1 ? ` (${selectedAccounts.length})` : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
