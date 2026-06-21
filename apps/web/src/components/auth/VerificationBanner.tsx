'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

/** Shown on dashboard only when the user still needs to verify their email. */
export function VerificationBanner() {
  const { data: session } = useSession();

  if (!session?.user || session.user.isVerified) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Please verify your email.
      </div>
      <Link
        href="/verify"
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-amber-700"
      >
        Verify now
      </Link>
    </div>
  );
}
