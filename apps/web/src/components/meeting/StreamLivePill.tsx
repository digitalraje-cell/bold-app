'use client';

import type { StreamDisplayStatus } from '@boldmeet/shared';
import { buildStreamLiveSummaryLabel } from '@/lib/stream-live-ui';
import { cn } from '@/lib/utils';

interface StreamLivePillProps {
  onClick: () => void;
  displayStatus: StreamDisplayStatus;
  elapsedSeconds: number;
  viewerCount?: number | null;
  className?: string;
}

export function StreamLivePill({
  onClick,
  displayStatus,
  elapsedSeconds,
  viewerCount,
  className,
}: StreamLivePillProps) {
  const label = buildStreamLiveSummaryLabel({
    displayStatus,
    elapsedSeconds,
    viewerCount,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex w-fit max-w-[min(100vw-5rem,18rem)] items-center gap-1.5 whitespace-nowrap rounded-full bg-red-600/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-elevated)] backdrop-blur transition hover:bg-red-700 sm:max-w-[20rem] sm:px-3 sm:text-sm',
        className,
      )}
      aria-label={`Show YouTube Live panel — ${label}`}
    >
      {displayStatus === 'LIVE' ? (
        <span className="shrink-0" aria-hidden>
          🔴
        </span>
      ) : (
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" aria-hidden />
      )}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
