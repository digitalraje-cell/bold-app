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

export function StreamLivePill({ displayStatus, onClick, className }: StreamLivePillProps) {
  const label = livePillLabel(displayStatus);
  const classNames = cn(
    'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-red-600/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-elevated)] backdrop-blur sm:px-3 sm:text-sm',
    onClick && 'transition hover:bg-red-700',
    className,
  );

  const content = (
    <>
      {displayStatus === 'LIVE' ? (
        <span className="shrink-0" aria-hidden>
          🔴
        </span>
      ) : (
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" aria-hidden />
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
