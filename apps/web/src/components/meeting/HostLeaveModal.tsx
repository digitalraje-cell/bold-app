'use client';

import { Button } from '@/components/ui/Button';

interface HostLeaveModalProps {
  open: boolean;
  onClose: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
  loading?: boolean;
}

export function HostLeaveModal({
  open,
  onClose,
  onLeave,
  onEndForAll,
  loading,
}: HostLeaveModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Leave meeting or end for everyone?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          You can leave and keep the meeting running for others, or end the meeting for all
          participants.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button className="w-full" variant="secondary" disabled={loading} onClick={onLeave}>
            Leave meeting
          </Button>
          <Button className="w-full" disabled={loading} onClick={onEndForAll}>
            End for everyone
          </Button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
