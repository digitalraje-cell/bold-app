'use client';

import { useEffect } from 'react';
import { isPwaStandalone, trackPwaEvent } from '@/hooks/usePwaInstall';

export function PwaRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability may still work in some browsers without SW
    });

    if (isPwaStandalone()) {
      void trackPwaEvent('PWA_OPENED');
    }
  }, []);

  return null;
}
