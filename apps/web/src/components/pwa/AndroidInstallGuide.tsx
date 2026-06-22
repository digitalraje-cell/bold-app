'use client';

import { MoreVertical, Download } from 'lucide-react';

export function AndroidInstallGuide({ hasNativePrompt }: { hasNativePrompt: boolean }) {
  if (hasNativePrompt) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Tap <strong className="text-foreground">Install</strong> above when Chrome shows the install
        prompt. After installing, open Bold from your home screen.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] p-4 text-sm">
      <p className="font-medium">Install Bold on Android</p>
      <ol className="mt-3 space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          <MoreVertical className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tap the <strong className="text-foreground">⋮</strong> menu in Chrome (top right).
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Download className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tap <strong className="text-foreground">Install app</strong> or{' '}
            <strong className="text-foreground">Add to Home screen</strong>.
          </span>
        </li>
        <li>
          Launch <strong className="text-foreground">Bold</strong> from your home screen, then open
          your meeting again.
        </li>
      </ol>
    </div>
  );
}
