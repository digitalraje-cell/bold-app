'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_MS = 4000;

export function useMeetingControlsAutoHide(forceVisible: boolean) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reveal = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!forceVisible) {
      timerRef.current = setTimeout(() => setVisible(false), IDLE_MS);
    }
  }, [forceVisible]);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    reveal();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [forceVisible, reveal]);

  useEffect(() => {
    const onActivity = () => reveal();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('mousedown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [reveal]);

  return { controlsVisible: visible, revealControls: reveal };
}
