'use client';

import { X } from 'lucide-react';
import { YOUTUBE_TOAST_CLASS } from '@/lib/meeting-youtube-overlay-layout';
import { cn } from '@/lib/utils';

interface YouTubeLiveOpenToastProps {
  onOpen: () => void;
  onDismiss: () => void;
  className?: string;
}

export function YouTubeLiveOpenToast({ onOpen, onDismiss, className }: YouTubeLiveOpenToastProps) {
  return (
    <div className={cn(YOUTUBE_TOAST_CLASS, 'relative pr-9', className)} role="status">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <p className="text-sm font-semibold text-foreground">Your YouTube stream is live</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Tap to open on YouTube</p>
      </button>
    </div>
  );
}
