'use client';

import Link from 'next/link';
import { MEETING_GO_LIVE_COMING_SOON_DESTINATIONS } from '@boldmeet/shared';
import { badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function GoLiveComingSoonDestinations({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-dashed border-border bg-muted/20 p-4',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Max destinations
        </p>
        <span className={cn(badgeClass(), 'text-[9px]')}>Coming Soon</span>
      </div>
      <ul className="space-y-2">
        {MEETING_GO_LIVE_COMING_SOON_DESTINATIONS.map((provider) => (
          <li
            key={provider.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/60 bg-surface/50 px-3 py-2 text-sm text-muted-foreground"
          >
            <span>{provider.name}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              Coming Soon
            </span>
          </li>
        ))}
      </ul>
      <Link href="/max" className="mt-3 inline-block text-xs font-medium text-foreground underline">
        Join Max waitlist →
      </Link>
    </div>
  );
}
