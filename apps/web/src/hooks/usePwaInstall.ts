'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  detectBrowser,
  getBrowserContinueLabel,
  isIosDevice,
  type BrowserName,
  type PwaAnalyticsEvent,
} from '@boldmeet/shared';
import { api } from '@/lib/api';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browser, setBrowser] = useState<BrowserName>('other');
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setBrowser(detectBrowser(ua));
    setIsIos(isIosDevice(ua));
    setIsInstalled(isPwaStandalone());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      void trackPwaEvent('PWA_INSTALLED');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const trackPwaEvent = useCallback(
    async (event: PwaAnalyticsEvent, extra?: { meetingId?: string; meetingCode?: string }) => {
      try {
        await api.pwa.track({
          event,
          browser,
          platform: isPwaStandalone() ? 'pwa' : isIos ? 'ios' : 'browser',
          ...extra,
        });
      } catch {
        // Non-blocking analytics
      }
    },
    [browser, isIos],
  );

  const promptInstall = useCallback(async () => {
    await trackPwaEvent('PWA_INSTALL_PROMPTED');

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        await trackPwaEvent('PWA_INSTALLED');
      }
      setDeferredPrompt(null);
      return { mode: 'native' as const, accepted: choice.outcome === 'accepted' };
    }

    return { mode: 'manual' as const, accepted: false };
  }, [deferredPrompt, trackPwaEvent]);

  const continueLabel = getBrowserContinueLabel(browser);

  return {
    browser,
    continueLabel,
    isIos,
    isInstalled,
    canNativeInstall: Boolean(deferredPrompt),
    promptInstall,
    trackPwaEvent,
  };
}

export async function trackPwaEvent(
  event: PwaAnalyticsEvent,
  extra?: { meetingId?: string; meetingCode?: string; browser?: BrowserName },
) {
  try {
    await api.pwa.track({
      event,
      browser: extra?.browser ?? detectBrowser(navigator.userAgent),
      platform: isPwaStandalone() ? 'pwa' : 'browser',
      meetingId: extra?.meetingId,
      meetingCode: extra?.meetingCode,
    });
  } catch {
    // Non-blocking
  }
}
