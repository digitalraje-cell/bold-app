'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AppVersionResponse } from '@boldmeet/shared';
import { isPwaStandalone, trackPwaEvent } from '@/hooks/usePwaInstall';
import { clearPendingJoin, readPendingJoin } from '@/lib/pwa-pending-join';
import {
  activateWaitingServiceWorker,
  getServiceWorkerUrl,
  isInMeetingPath,
} from '@/lib/pwa-update';
import { appVersion, serviceWorkerBuildId } from '@/lib/version';
import { usePwaUpdateStore } from '@/stores/pwaUpdateStore';
import { PwaUpdateToast } from '@/components/pwa/PwaUpdateToast';
import { PwaUpdateMeetingBanner } from '@/components/pwa/PwaUpdateMeetingBanner';
import { PwaForceUpdateModal } from '@/components/pwa/PwaForceUpdateModal';

const AUTO_UPDATE_MS = 30_000;

function watchWaitingWorker(
  registration: ServiceWorkerRegistration,
  onUpdate: () => void,
) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    onUpdate();
  }

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) return;

    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        onUpdate();
      }
    });
  });
}

export function PwaUpdateManager() {
  const router = useRouter();
  const pathname = usePathname();
  const inMeeting = isInMeetingPath(pathname);
  const wasInMeetingRef = useRef(inMeeting);

  const {
    updateAvailable,
    pendingUpdate,
    forceUpdate,
    registration,
    dismissedMeetingBanner,
    setRegistration,
    dispatchUpdateAvailable,
    dismissMeetingBanner,
    clearUpdate,
  } = usePwaUpdateStore();

  const [applying, setApplying] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const autoUpdateTimerRef = useRef<number | null>(null);

  const applyUpdate = useCallback(async () => {
    const reg = usePwaUpdateStore.getState().registration;
    if (!reg?.waiting || applying) return;
    setApplying(true);
    try {
      await activateWaitingServiceWorker(reg);
      clearUpdate();
    } catch {
      setApplying(false);
    }
  }, [applying, clearUpdate]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker
      .register(getServiceWorkerUrl(serviceWorkerBuildId))
      .then((reg) => {
        if (cancelled) return;
        setRegistration(reg);
        watchWaitingWorker(reg, () => dispatchUpdateAvailable(usePwaUpdateStore.getState().forceUpdate));

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatchUpdateAvailable(usePwaUpdateStore.getState().forceUpdate);
            }
          });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [dispatchUpdateAvailable, setRegistration]);

  useEffect(() => {
    void fetch('/api/app/version')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AppVersionResponse | null) => {
        if (!data?.release?.forceUpdate) return;
        if (data.release.version !== appVersion) {
          usePwaUpdateStore.getState().setForceUpdate(true);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (autoUpdateTimerRef.current) {
      window.clearTimeout(autoUpdateTimerRef.current);
      autoUpdateTimerRef.current = null;
    }

    if (!updateAvailable || inMeeting || toastDismissed || forceUpdate) return;

    autoUpdateTimerRef.current = window.setTimeout(() => {
      void applyUpdate();
    }, AUTO_UPDATE_MS);

    return () => {
      if (autoUpdateTimerRef.current) {
        window.clearTimeout(autoUpdateTimerRef.current);
      }
    };
  }, [updateAvailable, inMeeting, toastDismissed, forceUpdate, applyUpdate]);

  useEffect(() => {
    const wasInMeeting = wasInMeetingRef.current;
    wasInMeetingRef.current = inMeeting;

    if (wasInMeeting && !inMeeting && pendingUpdate && registration?.waiting) {
      void applyUpdate();
    }
  }, [inMeeting, pendingUpdate, registration?.waiting, applyUpdate]);

  const showForceModal =
    forceUpdate && updateAvailable && !inMeeting && Boolean(registration?.waiting);
  const showToast =
    updateAvailable && !inMeeting && !forceUpdate && !toastDismissed && !showForceModal;
  const showMeetingBanner =
    updateAvailable && inMeeting && pendingUpdate && !dismissedMeetingBanner;

  useEffect(() => {
    if (!showForceModal) return;
    const blockNavigation = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', blockNavigation, true);
    return () => document.removeEventListener('click', blockNavigation, true);
  }, [showForceModal]);

  return (
    <>
      {showToast && (
        <PwaUpdateToast
          loading={applying}
          onUpdate={() => void applyUpdate()}
          onDismiss={() => setToastDismissed(true)}
        />
      )}
      {showMeetingBanner && <PwaUpdateMeetingBanner onDismiss={dismissMeetingBanner} />}
      {showForceModal && (
        <PwaForceUpdateModal loading={applying} onUpdate={() => void applyUpdate()} />
      )}
    </>
  );
}
