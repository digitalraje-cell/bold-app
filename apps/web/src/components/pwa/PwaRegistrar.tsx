'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isPwaStandalone, trackPwaEvent } from '@/hooks/usePwaInstall';
import { clearPendingJoin, readPendingJoin } from '@/lib/pwa-pending-join';

export function PwaRegistrar() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability may still work in some browsers without SW
    });

    if (!isPwaStandalone()) return;

    void trackPwaEvent('PWA_OPENED');

    const pendingJoin = readPendingJoin();
    if (!pendingJoin) return;

    const target = `/join/${pendingJoin}`;
    if (pathname === target || pathname?.startsWith(`/meeting/${pendingJoin}`)) {
      clearPendingJoin();
      return;
    }

    clearPendingJoin();
    router.replace(target);
  }, [router, pathname]);

  return null;
}
