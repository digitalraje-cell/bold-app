'use client';

interface YouTubeLiveOpenToastProps {
  onOpen: () => void;
  onDismiss: () => void;
}

export function YouTubeLiveOpenToast({ onOpen, onDismiss }: YouTubeLiveOpenToastProps) {
  return (
    <div className="pointer-events-auto fixed bottom-24 left-1/2 z-50 w-[min(100vw-2rem,22rem)] -translate-x-1/2 sm:bottom-8">
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-[var(--radius-lg)] bg-foreground px-4 py-3 text-left text-background shadow-[var(--shadow-elevated)] transition hover:opacity-95"
      >
        <p className="text-sm font-semibold">Your YouTube stream is live. Tap here to open.</p>
        <p className="mt-1 text-xs font-medium text-background/80">Open YouTube</p>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 w-full text-center text-xs font-medium text-white/70 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}
