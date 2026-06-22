'use client';

import type {
  LiveStreamDestinationView,
  StreamConnectionState,
  StreamDisplayStatus,
  YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { buildYouTubeStudioLiveUrl } from '@boldmeet/shared';

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
  onCopyWatchUrl?: () => void;
  onOpenYouTube?: () => void;
  onStopLive?: () => void;
  className?: string;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
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
  onCopyWatchUrl,
  onOpenYouTube,
  onStopLive,
  className,
}: StreamStatusPanelProps) {
  const isLive = displayStatus === 'LIVE';
  const isConnecting = displayStatus === 'CONNECTING';

  const activeDestinations =
    destinations.length > 0
      ? destinations.filter((d) => d.watchUrl)
      : watchUrl
        ? [{ id: 'primary', channelName: null, watchUrl, youtubeAccountId: null, status: 'LIVE' as const }]
        : [];

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-surface/95 px-4 py-3 text-foreground shadow-[var(--shadow-elevated)] backdrop-blur',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            LIVE
          </span>
        )}
        {isConnecting && (
          <span className="text-sm font-medium text-muted-foreground">Connecting…</span>
        )}
        {displayStatus === 'ERROR' && (
          <span className="text-sm font-medium text-destructive">Stream error</span>
        )}
        {(isLive || isConnecting) && (
          <span className="font-mono text-sm text-muted-foreground">
            {formatElapsed(elapsedSeconds)}
          </span>
        )}
        {isLive && viewerCount != null && (
          <span className="text-sm text-muted-foreground">
            {viewerCount.toLocaleString()} watching
          </span>
        )}
        {isLive && visibility && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {VISIBILITY_LABELS[visibility]}
          </span>
        )}
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

      {error && displayStatus === 'ERROR' && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}

      {isLive && activeDestinations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onCopyWatchUrl && activeDestinations.length === 1 && (
            <Button type="button" size="sm" variant="secondary" onClick={onCopyWatchUrl}>
              Copy URL
            </Button>
          )}
          {onOpenYouTube && activeDestinations.length === 1 && (
            <Button type="button" size="sm" onClick={onOpenYouTube}>
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
                  className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  {dest.channelName ?? 'Watch'}
                </a>
              ) : null,
            )}
          <a
            href={buildYouTubeStudioLiveUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold"
          >
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
