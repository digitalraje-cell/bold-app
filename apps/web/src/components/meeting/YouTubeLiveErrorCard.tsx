'use client';

import { Button } from '@/components/ui/Button';
import { YOUTUBE_FLOATING_CARD_CLASS } from '@/lib/meeting-youtube-overlay-layout';
import { cn } from '@/lib/utils';

interface YouTubeLiveErrorCardProps {
  message: string;
  onRetry?: () => void;
  onStartLiveAgain?: () => void;
  retryLoading?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function YouTubeLiveErrorCard({
  message,
  onRetry,
  onStartLiveAgain,
  retryLoading,
  className,
}: YouTubeLiveErrorCardProps) {
  return (
    <div className={cn(YOUTUBE_FLOATING_CARD_CLASS, className)} role="alert">
      <p className="text-xs font-semibold text-destructive">YouTube Live</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>
      {(onRetry || onStartLiveAgain) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry && (
            <Button type="button" size="sm" variant="secondary" loading={retryLoading} onClick={onRetry}>
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
  );
}
