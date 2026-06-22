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
    <div className="mb-4 rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
      {message}
    </div>
  );
}
