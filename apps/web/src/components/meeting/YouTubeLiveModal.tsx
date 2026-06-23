'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
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
import { youtubeOverlayStackTopClass } from '@/lib/meeting-youtube-overlay-layout';
import { cn } from '@/lib/utils';
import type { StartLiveStreamParams } from '@/hooks/useYouTubeLiveStream';

interface YouTubeLiveModalProps {
  open: boolean;
  meetingId: string;
  loading?: boolean;
  onClose: () => void;
  onStart: (params: StartLiveStreamParams) => Promise<unknown>;
  offsetBelowHeader?: boolean;
}

export function YouTubeLiveModal({
  open,
  loading,
  onClose,
  onStart,
  offsetBelowHeader = false,
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
    <div
      className={cn(
        'pointer-events-none fixed right-3 z-[75] flex w-[min(calc(100vw-1.5rem),22rem)] flex-col sm:right-4',
        youtubeOverlayStackTopClass(offsetBelowHeader),
        'bottom-[calc(var(--meeting-controls-offset,5.5rem)+env(safe-area-inset-bottom,0px)+0.75rem)]',
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/60 bg-surface/95 shadow-[var(--shadow-elevated)] backdrop-blur',
          accounts.length > 0 ? 'p-4 sm:p-5' : 'p-4 sm:p-5',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Go Live on YouTube
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {connectionLoading ? (
          <p className="text-sm text-muted-foreground">Loading your channels…</p>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col gap-4">
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
            className="flex flex-col gap-3"
          >
            <div className="space-y-3">
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
                Viewers on YouTube see the same meeting stage as attendees here. Title and
                description are set from this meeting automatically.
              </p>
            </div>

            <div className="shrink-0 space-y-3 border-t border-border/60 pt-3">
              {error ? <Alert>{error}</Alert> : null}
              <div className="flex gap-3">
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
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
