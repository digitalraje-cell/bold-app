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

  const effectiveAutoHide = autoHideEnabled && !isMobileViewport();

  const controlsVisible = forceVisible || !effectiveAutoHide || !idleHidden;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    if (forceVisible || !effectiveAutoHide) return;
    timerRef.current = setTimeout(() => setIdleHidden(true), IDLE_MS);
  }, [effectiveAutoHide, clearTimer, forceVisible]);

  const reveal = useCallback(() => {
    setIdleHidden(false);
    scheduleHide();
  }, [scheduleHide]);

  const toggleMobile = useCallback(() => {
    if (!isMobileViewport()) return;
    reveal();
  }, [reveal]);

  useEffect(() => {
    if (forceVisible || !effectiveAutoHide) {
      clearTimer();
      setIdleHidden(false);
      return;
    }
    scheduleHide();
    return clearTimer;
  }, [effectiveAutoHide, clearTimer, forceVisible, scheduleHide]);

  useEffect(() => {
    if (!effectiveAutoHide) return;

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
  }, [effectiveAutoHide, reveal]);

  return {
    controlsVisible,
    revealControls: reveal,
    toggleControlsMobile: toggleMobile,
  };
}
