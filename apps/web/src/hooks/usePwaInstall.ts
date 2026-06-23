'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  detectBrowser,
  getBrowserContinueLabel,
  isAndroidUserAgent,
  isIosDevice,
  isPwaStandalone,
  type BrowserName,
  type PwaAnalyticsEvent,
} from '@boldmeet/shared';
import { api } from '@/lib/api';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export { isPwaStandalone } from '@boldmeet/shared';

export function isAndroidDevice(userAgent: string): boolean {
  return isAndroidUserAgent(userAgent);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browser, setBrowser] = useState<BrowserName>('other');
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setBrowser(detectBrowser(ua));
    setIsIos(isIosDevice(ua));
    setIsAndroid(isAndroidUserAgent(ua));
    setIsInstalled(isPwaStandalone());
    setReady(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      void trackPwaEvent('PWA_INSTALLED');
    };

    const onDisplayModeChange = () => {
      setIsInstalled(isPwaStandalone());
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  const trackPwaEvent = useCallback(
    async (event: PwaAnalyticsEvent, extra?: { meetingId?: string; meetingCode?: string }) => {
      try {
        await api.pwa.track({
          event,
          browser,
          platform: isPwaStandalone() ? 'pwa' : isIos ? 'ios' : isAndroid ? 'android' : 'browser',
          ...extra,
        });
      } catch {
        // Non-blocking analytics
      }
    },
    [browser, isIos, isAndroid],
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
    isAndroid,
    isInstalled,
    ready,
    canNativeInstall: Boolean(deferredPrompt),
    promptInstall,
    trackPwaEvent,
  };
}

export async function trackPwaEvent(
  event: PwaAnalyticsEvent,
  extra?: { meetingId?: string; meetingCode?: string; browser?: BrowserName },
) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  try {
    await api.pwa.track({
      event,
      browser: extra?.browser ?? detectBrowser(ua),
      platform: isPwaStandalone() ? 'pwa' : isIosDevice(ua) ? 'ios' : isAndroidUserAgent(ua) ? 'android' : 'browser',
      meetingId: extra?.meetingId,
      meetingCode: extra?.meetingCode,
    });
  } catch {
    // Non-blocking
  }
}
