'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MediaConnectionErrorProps {
  meetingId: string;
  message: string;
  onRetry?: () => void;
}

export function MediaConnectionError({ meetingId, message, onRetry }: MediaConnectionErrorProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white">Could not connect to meeting</h2>
      <p className="mt-2 max-w-md text-sm text-white/60">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        )}
        <Link
          href={`/meeting/${meetingId}`}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          Back to lobby
        </Link>
      </div>
    </div>
  );
}
