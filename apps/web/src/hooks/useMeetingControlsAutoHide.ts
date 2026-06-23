'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_MS = 3000;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
}

export function useMeetingControlsAutoHide(
  forceVisible: boolean,
  autoHideEnabled: boolean = true,
) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    if (forceVisible || !autoHideEnabled) return;
    timerRef.current = setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, IDLE_MS);
  }, [autoHideEnabled, clearTimer, forceVisible]);

  const reveal = useCallback(() => {
    visibleRef.current = true;
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const toggleMobile = useCallback(() => {
    if (!isMobileViewport()) return;
    if (visibleRef.current) {
      reveal();
      return;
    }
    reveal();
  }, [reveal]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (forceVisible || !autoHideEnabled) {
      visibleRef.current = true;
      setVisible(true);
      clearTimer();
      return;
    }
    reveal();
    return clearTimer;
  }, [autoHideEnabled, clearTimer, forceVisible, reveal]);

  useEffect(() => {
    if (!autoHideEnabled) return;

    const onActivity = () => {
      if (!isMobileViewport()) reveal();
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('mousedown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [autoHideEnabled, reveal]);

  return {
    controlsVisible: visible,
    revealControls: reveal,
    toggleControlsMobile: toggleMobile,
  };
}
