'use client';

import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface PwaUpdateMeetingBannerProps {
  onDismiss: () => void;
}

export function PwaUpdateMeetingBanner({ onDismiss }: PwaUpdateMeetingBannerProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-[85] flex justify-center px-4 pt-3 pointer-events-none">
      <div className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-full bg-surface px-4 py-2.5 shadow-[var(--shadow-elevated)]">
        <p className="flex-1 text-xs font-medium text-foreground sm:text-sm">
          New version available. It will be installed when you leave this meeting.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
