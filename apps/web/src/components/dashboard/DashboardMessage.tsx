'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function DashboardMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message');

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => router.replace('/dashboard'), 8000);
    return () => clearTimeout(timer);
  }, [message, router]);

  if (!message) return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
      {message}
    </div>
  );
}
