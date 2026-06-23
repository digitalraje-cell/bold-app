'use client';

import { Button } from '@/components/ui/Button';
import { YOUTUBE_FLOATING_CARD_CLASS } from '@/lib/meeting-youtube-overlay-layout';
import { cn } from '@/lib/utils';

interface YouTubeLiveResumeBannerProps {
  loading?: boolean;
  onResume: () => void;
  onStop: () => void;
  className?: string;
}

export function YouTubeLiveResumeBanner({
  loading,
  onResume,
  onStop,
  className,
}: YouTubeLiveResumeBannerProps) {
  return (
    <div
      className={cn(YOUTUBE_FLOATING_CARD_CLASS, 'relative pr-10', className)}
      role="status"
      aria-labelledby="youtube-live-paused-title"
      aria-describedby="youtube-live-paused-description"
    >
      <h2
        id="youtube-live-paused-title"
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        YouTube Live Paused
      </h2>
      <p
        id="youtube-live-paused-description"
        className="mt-1.5 text-xs leading-relaxed text-muted-foreground"
      >
        Your YouTube stream is no longer sending video.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="flex-1" loading={loading} onClick={onResume}>
          {loading ? 'Resuming…' : 'Resume Live'}
        </Button>
        <Button size="sm" className="flex-1" variant="secondary" disabled={loading} onClick={onStop}>
          End Live
        </Button>
      </div>
    </div>
  );
}
