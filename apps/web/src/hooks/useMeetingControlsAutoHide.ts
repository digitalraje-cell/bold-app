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
  const [idleHidden, setIdleHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controlsVisible = forceVisible || !autoHideEnabled || !idleHidden;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    if (forceVisible || !autoHideEnabled) return;
    timerRef.current = setTimeout(() => setIdleHidden(true), IDLE_MS);
  }, [autoHideEnabled, clearTimer, forceVisible]);

  const reveal = useCallback(() => {
    setIdleHidden(false);
    scheduleHide();
  }, [scheduleHide]);

  const toggleMobile = useCallback(() => {
    if (!isMobileViewport()) return;
    reveal();
  }, [reveal]);

  useEffect(() => {
    if (forceVisible || !autoHideEnabled) {
      clearTimer();
      return;
    }
    scheduleHide();
    return clearTimer;
  }, [autoHideEnabled, clearTimer, forceVisible, scheduleHide]);

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
    controlsVisible,
    revealControls: reveal,
    toggleControlsMobile: toggleMobile,
  };
}
