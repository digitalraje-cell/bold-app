'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MeetingBroadcastProviderType,
  YOUTUBE_LIVE_ACTIVATION_MESSAGE,
  isMaxPlanComingSoon,
  type YouTubeChannelAccount,
  type YouTubeConnectionStatus,
  type YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/lib/api';
import { formatYouTubeLiveUserError } from '@/lib/youtube-live-errors';
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

  const isBusy = Boolean(loading);

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);
    try {
      const status = (await api.youtube.status(true)) as YouTubeConnectionStatus;
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
    } catch (err) {
      setConnection(null);
      setError(formatYouTubeLiveUserError(err, 'youtube-live-modal:load'));
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
    if (isBusy) return;
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
    if (selectedAccountIds.length === 0 || isBusy) return;
    setError('');
    try {
      await onStart({
        provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
        youtubeAccountIds: selectedAccountIds,
        visibility,
      });
      onClose();
    } catch (err) {
      setError(formatYouTubeLiveUserError(err, 'youtube-live-modal:start'));
    }
  }

  function renderChannelOption(account: YouTubeChannelAccount) {
    const selected = selectedAccountIds.includes(account.id);
    return (
      <button
        key={account.id}
        type="button"
        disabled={isBusy}
        onClick={() => toggleAccount(account.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition',
          selected
            ? 'border-foreground bg-background font-medium text-foreground'
            : 'border-border bg-surface text-foreground hover:bg-muted/50',
          isBusy && 'cursor-not-allowed opacity-60',
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
          <img src={account.channelAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : null}
        <span className="flex-1 truncate">{account.name}</span>
      </button>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'flex w-full max-w-sm flex-col rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-elevated)]',
          accounts.length > 0 ? 'min-h-[22rem] max-h-[min(26rem,90vh)] p-5 sm:max-w-md sm:p-6' : 'p-5 sm:p-6',
        )}
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Go Live on YouTube
        </h2>

        {connectionLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading your channels…</p>
        ) : accounts.length === 0 ? (
          <div className="mt-4 flex flex-1 flex-col gap-4">
            {allAccounts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {YOUTUBE_LIVE_ACTIVATION_MESSAGE}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Manage your channel in Settings → Integrations.
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Connect a YouTube channel in Settings → Integrations first. You only sign in once —
                then go live from any meeting with one click.
              </p>
            )}
            <div className="min-h-[3rem]">
              {error ? <Alert>{error}</Alert> : null}
            </div>
            <div className="mt-auto flex gap-3">
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
          <form
            onSubmit={(e) => void handleGoLive(e)}
            className="mt-4 flex min-h-0 flex-1 flex-col gap-3"
          >
            <div className="min-h-0 flex-1 space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {multiSelect ? 'YouTube channels' : 'YouTube channel'}
                </p>
                <div className="max-h-28 space-y-1.5 overflow-y-auto sm:max-h-32">
                  {accounts.map(renderChannelOption)}
                </div>
                {multiSelect && limits && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Select up to {limits.maxSimultaneousDestinations} channels.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="youtube-visibility"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Visibility
                </label>
                <select
                  id="youtube-visibility"
                  value={visibility}
                  disabled={isBusy}
                  onChange={(e) => setVisibility(e.target.value as YouTubePrivacyStatus)}
                  className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Title and description are set from this meeting automatically.
              </p>
            </div>

            <div className="min-h-[3.25rem] shrink-0">
              {error ? <Alert>{error}</Alert> : null}
            </div>

            <div className="flex shrink-0 gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={isBusy}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={isBusy}
                disabled={selectedAccounts.length === 0 || isBusy}
              >
                {isBusy ? 'Starting Live Stream…' : 'Go Live'}
                {!isBusy && selectedAccounts.length > 1 ? ` (${selectedAccounts.length})` : ''}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
