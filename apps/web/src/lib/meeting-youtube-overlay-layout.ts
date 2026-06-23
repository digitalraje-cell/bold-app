/** Non-blocking top-right stack for YouTube Live status, toasts, and panels. */
export const YOUTUBE_OVERLAY_STACK_CLASS =
  'pointer-events-none fixed right-3 z-40 flex w-[min(calc(100vw-1.5rem),20rem)] flex-col items-stretch gap-2 sm:right-4';

export function youtubeOverlayStackTopClass(offsetBelowHeader = false): string {
  const base = 'top-[max(0.75rem,env(safe-area-inset-top))]';
  return offsetBelowHeader ? `${base} sm:top-14` : base;
}

export const YOUTUBE_FLOATING_CARD_CLASS =
  'pointer-events-auto w-full rounded-[var(--radius-lg)] border border-border/60 bg-surface/95 p-4 text-foreground shadow-[var(--shadow-elevated)] backdrop-blur';

export const YOUTUBE_TOAST_CLASS =
  'pointer-events-auto w-full rounded-[var(--radius-lg)] border border-border/60 bg-surface/95 p-3 shadow-[var(--shadow-elevated)] backdrop-blur';
