'use client';

import { Button } from '@/components/ui/Button';
import { YouTubeBetaBanner } from '@/components/meeting/YouTubeBetaBanner';

interface YouTubeLiveResumeBannerProps {
  loading?: boolean;
  onResume: () => void;
  onStop: () => void;
}

export function YouTubeLiveResumeBanner({
  loading,
  onResume,
  onStop,
}: YouTubeLiveResumeBannerProps) {
  return (
    <div className="absolute left-1/2 top-20 z-40 w-[min(100%,24rem)] -translate-x-1/2 rounded-xl border border-amber-500/40 bg-slate-900/95 p-4 text-white shadow-xl backdrop-blur">
      <YouTubeBetaBanner />
      <p className="mt-3 text-sm text-white/90">
        Your YouTube broadcast is still running, but screen capture was disconnected. Click Resume
        Stream and choose the same screen or tab to continue.
      </p>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" disabled={loading} onClick={onResume}>
          {loading ? 'Resuming…' : 'Resume Stream'}
        </Button>
        <Button className="flex-1" variant="secondary" onClick={onStop}>
          Stop Stream
        </Button>
      </div>
    </div>
  );
}
