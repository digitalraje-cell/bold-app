'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, Tv, X } from 'lucide-react';
import type {
  LiveStreamDestinationView,
  StreamConnectionState,
  StreamDisplayStatus,
  YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { buildYouTubeStudioLiveUrl } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { formatStreamElapsed } from '@/lib/stream-live-ui';
import { cn } from '@/lib/utils';

interface StreamStatusPanelProps {
  displayStatus: StreamDisplayStatus;
  connectionState: StreamConnectionState;
  streamHealth: 'healthy' | 'degraded' | 'offline';
  elapsedSeconds: number;
  viewerCount?: number | null;
  visibility?: YouTubePrivacyStatus | null;
  title?: string | null;
  watchUrl?: string | null;
  destinations?: LiveStreamDestinationView[];
  error?: string | null;
  stopping?: boolean;
  onClose?: () => void;
  onCopyWatchUrl?: () => void | Promise<void>;
  onOpenYouTube?: () => void;
  onStopLive?: () => void;
  onRetry?: () => void;
  onStartLiveAgain?: () => void;
  retryLoading?: boolean;
  className?: string;
}

function formatElapsed(seconds: number): string {
  return formatStreamElapsed(seconds);
}

const VISIBILITY_LABELS: Record<YouTubePrivacyStatus, string> = {
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
};

export function StreamStatusPanel({
  displayStatus,
  elapsedSeconds,
  viewerCount,
  visibility,
  title,
  watchUrl,
  destinations = [],
  error,
  stopping,
  onClose,
  onCopyWatchUrl,
  onOpenYouTube,
  onStopLive,
  onRetry,
  onStartLiveAgain,
  retryLoading,
  className,
}: StreamStatusPanelProps) {
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const isLive = displayStatus === 'LIVE';
  const isConnecting = displayStatus === 'CONNECTING';

  const activeDestinations =
    destinations.length > 0
      ? destinations.filter((d) => d.watchUrl)
      : watchUrl
        ? [{ id: 'primary', channelName: null, watchUrl, youtubeAccountId: null, status: 'LIVE' as const }]
        : [];

  useEffect(() => {
    if (!copyToast) return;
    const id = window.setTimeout(() => setCopyToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [copyToast]);

  const handleCopy = useCallback(async () => {
    if (!onCopyWatchUrl) return;
    try {
      await onCopyWatchUrl();
      setCopyToast('Watch URL copied');
    } catch {
      setCopyToast('Could not copy URL');
    }
  }, [onCopyWatchUrl]);

  const statusParts: string[] = [];
  if (isLive) statusParts.push('LIVE');
  if (isConnecting) statusParts.push('Connecting…');
  if (displayStatus === 'ERROR') statusParts.push('Disconnected');
  if (isLive || isConnecting) statusParts.push(formatElapsed(elapsedSeconds));
  if (isLive && viewerCount != null) {
    statusParts.push(`${viewerCount.toLocaleString()} watching`);
  }
  if (isLive && visibility) statusParts.push(VISIBILITY_LABELS[visibility]);

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-lg)] bg-surface/95 px-4 py-3 pr-10 text-foreground shadow-[var(--shadow-elevated)] backdrop-blur',
        className,
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          title="Close panel (stream continues)"
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close panel (stream continues)"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {isLive && (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-600" aria-hidden />
        )}
        <span
          className={cn(
            'font-medium',
            isLive && 'font-semibold text-foreground',
            isConnecting && 'text-muted-foreground',
            displayStatus === 'ERROR' && 'text-destructive',
          )}
        >
          {statusParts.join(' • ')}
        </span>
      </div>

      {activeDestinations.length > 0 && isLive && (
        <ul className="mt-2 space-y-1">
          {activeDestinations.map((dest) => (
            <li key={dest.id} className="truncate text-xs text-muted-foreground">
              {dest.channelName ? (
                <>
                  <span className="font-medium text-foreground">{dest.channelName}</span>
                  {' · '}
                </>
              ) : null}
              {dest.watchUrl}
            </li>
          ))}
        </ul>
      )}

      {title && (isLive || isConnecting) && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{title}</p>
      )}

      {error && (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-destructive">{error}</p>
          {(onRetry || onStartLiveAgain) && (
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={retryLoading}
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
              {onStartLiveAgain && (
                <Button type="button" size="sm" onClick={onStartLiveAgain}>
                  Start Live Again
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {copyToast && (
        <p
          className="mt-2 rounded-[var(--radius-md)] bg-foreground px-2.5 py-1 text-xs font-medium text-background"
          role="status"
        >
          {copyToast}
        </p>
      )}

      {isLive && activeDestinations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onCopyWatchUrl && activeDestinations.length === 1 && (
            <Button type="button" size="sm" variant="secondary" onClick={() => void handleCopy()}>
              <Copy className="h-3.5 w-3.5" />
              Copy URL
            </Button>
          )}
          {onOpenYouTube && activeDestinations.length === 1 && (
            <Button type="button" size="sm" onClick={onOpenYouTube}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open YouTube
            </Button>
          )}
          {activeDestinations.length > 1 &&
            activeDestinations.map((dest) =>
              dest.watchUrl ? (
                <a
                  key={dest.id}
                  href={dest.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {dest.channelName ?? 'Watch'}
                </a>
              ) : null,
            )}
          <a
            href={buildYouTubeStudioLiveUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
          >
            <Tv className="h-3.5 w-3.5" />
            Studio
          </a>
          {onStopLive && (
            <Button type="button" size="sm" variant="secondary" loading={stopping} onClick={onStopLive}>
              Stop Live
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
