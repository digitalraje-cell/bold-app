'use client';

import type { StreamDisplayStatus } from '@boldmeet/shared';
import { cn } from '@/lib/utils';

interface StreamLivePillProps {
  displayStatus: StreamDisplayStatus;
  onClick?: () => void;
  className?: string;
}

function livePillLabel(displayStatus: StreamDisplayStatus): string {
  if (displayStatus === 'LIVE') return 'LIVE';
  if (displayStatus === 'CONNECTING') return 'Connecting…';
  if (displayStatus === 'ERROR') return 'Disconnected';
  return 'LIVE';
}

/** Compact LIVE badge — top-right; click opens stream controls panel. */
export function StreamLivePill({ displayStatus, onClick, className }: StreamLivePillProps) {
  const label = livePillLabel(displayStatus);
  const classNames = cn(
    'pointer-events-auto inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-red-500/40 bg-red-600/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg backdrop-blur sm:px-2.5 sm:text-xs',
    onClick && 'transition hover:bg-red-700',
    className,
  );

  const content = (
    <>
      {displayStatus === 'LIVE' ? (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white" aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white/80" aria-hidden />
      )}
      <span>{label}</span>
    </>
  );

  if (!onClick) {
    return (
      <span className={classNames} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames}
      aria-label={`Show YouTube Live panel — ${label}`}
    >
      {content}
    </button>
  );
}
