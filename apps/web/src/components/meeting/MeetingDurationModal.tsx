'use client';

import { Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface MeetingDurationModalProps {
  open: boolean;
  message?: string;
  onClose: () => void;
  onLeave: () => void;
}

export function MeetingDurationModal({
  open,
  message,
  onClose,
  onLeave,
}: MeetingDurationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Meeting time ended
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {message ||
            'Your free meeting time has ended. Upgrade to continue unlimited meetings.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/settings/profile">
            <Button className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade plan
            </Button>
          </Link>
          <Button variant="secondary" className="w-full" onClick={onLeave}>
            Leave meeting
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export function MeetingGraceWarning({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed bottom-28 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
      Grace period active — meeting will end shortly.{' '}
      <button onClick={onDismiss} className="ml-2 underline">
        Dismiss
      </button>
    </div>
  );
}
