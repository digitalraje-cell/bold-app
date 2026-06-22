'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PwaUpdateToastProps {
  onUpdate: () => void;
  onDismiss?: () => void;
  loading?: boolean;
}

export function PwaUpdateToast({ onUpdate, onDismiss, loading }: PwaUpdateToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'fixed z-[90] w-[min(calc(100vw-2rem),22rem)] rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-elevated)]',
        'bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0',
      )}
    >
      <p className="text-sm font-semibold text-foreground">New version of Bold available</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Update now for the latest improvements. Auto-updates in 30 seconds.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={onUpdate} loading={loading}>
          Update Now
        </Button>
        {onDismiss && (
          <Button size="sm" variant="secondary" className="flex-1" onClick={onDismiss}>
            Later
          </Button>
        )}
      </div>
    </div>
  );
}
