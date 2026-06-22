'use client';

import { Button } from '@/components/ui/Button';

interface PwaForceUpdateModalProps {
  onUpdate: () => void;
  loading?: boolean;
}

export function PwaForceUpdateModal({ onUpdate, loading }: PwaForceUpdateModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-surface p-8 shadow-[var(--shadow-elevated)]">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          A critical update is required
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Bold needs to update before you can continue. This keeps your meetings secure and
          reliable.
        </p>
        <Button className="mt-6 w-full" onClick={onUpdate} loading={loading}>
          Update Now
        </Button>
      </div>
    </div>
  );
}
