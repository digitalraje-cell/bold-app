'use client';

import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
  label?: string;
}

export function LiveBadge({ className, label = 'LIVE on YouTube' }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white',
        className,
      )}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      {label}
    </span>
  );
}
