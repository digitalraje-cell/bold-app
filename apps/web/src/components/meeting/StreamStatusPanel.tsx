'use client';

import type { BroadcastStatus } from '@boldmeet/shared';

interface StreamStatusPanelProps {
  status: BroadcastStatus;
  startedAt: string | null;
  title?: string | null;
}

function formatStartedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

const STATUS_LABELS: Record<BroadcastStatus, string> = {
  IDLE: 'Not streaming',
  LIVE: 'Streaming to YouTube',
  ENDED: 'Stream ended',
  ERROR: 'Stream error',
};

export function StreamStatusPanel({ status, startedAt, title }: StreamStatusPanelProps) {
  const startedLabel = formatStartedAt(startedAt);

  return (
    <div className="rounded-lg bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur">
      <div className="font-medium text-white">{STATUS_LABELS[status]}</div>
      {title && status === 'LIVE' && (
        <div className="mt-0.5 truncate text-white/70">{title}</div>
      )}
      {startedLabel && status === 'LIVE' && (
        <div className="mt-0.5 text-white/60">Started {startedLabel}</div>
      )}
    </div>
  );
}
