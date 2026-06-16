'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface HostWaitingScreenProps {
  meetingId: string;
  title: string;
}

export function HostWaitingScreen({ meetingId, title }: HostWaitingScreenProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <Loader2 className="mb-6 h-12 w-12 animate-spin text-primary" />
      <h2 className="text-xl font-semibold text-white">Waiting for host to start meeting</h2>
      <p className="mt-2 max-w-sm text-sm text-white/60">
        {title ? `"${title}"` : 'The meeting'} will begin when the host joins.
      </p>
      <Link
        href={`/meeting/${meetingId}`}
        className="mt-8 text-sm text-primary hover:underline"
      >
        Back to lobby
      </Link>
    </div>
  );
}
