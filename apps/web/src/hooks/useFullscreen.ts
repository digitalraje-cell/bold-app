'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export function useFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  onChange?: (active: boolean) => void,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncState = useCallback(() => {
    const active = !!document.fullscreenElement;
    setIsFullscreen(active);
    onChange?.(active);
  }, [onChange]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncState);
    document.addEventListener('webkitfullscreenchange', syncState as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', syncState);
      document.removeEventListener('webkitfullscreenchange', syncState as EventListener);
    };
  }, [syncState]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current as FullscreenElement | null;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Safari may reject without user gesture — fall back to fixed overlay feel
      setIsFullscreen(true);
      onChange?.(true);
    }
  }, [containerRef, onChange]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    }
    setIsFullscreen(false);
    onChange?.(false);
  }, [onChange]);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
