'use client';

import { Share, PlusSquare } from 'lucide-react';

export function IosInstallGuide() {
  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] p-4 text-sm">
      <p className="font-medium">Add Bold to your Home Screen</p>
      <ol className="mt-3 space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          <Share className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tap <strong className="text-foreground">Share</strong> in Safari&apos;s toolbar (bottom on
            iPhone).
          </span>
        </li>
        <li className="flex items-start gap-2">
          <PlusSquare className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Scroll and tap <strong className="text-foreground">Add to Home Screen</strong>, then tap{' '}
            <strong className="text-foreground">Add</strong>.
          </span>
        </li>
        <li>
          Open <strong className="text-foreground">Bold</strong> from your home screen to join in
          standalone mode.
        </li>
      </ol>
    </div>
  );
}
