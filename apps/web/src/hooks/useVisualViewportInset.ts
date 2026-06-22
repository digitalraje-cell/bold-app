'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks how much of the layout viewport is covered by the on-screen keyboard
 * (or other visual viewport shrink) on mobile browsers.
 */
export function useVisualViewportInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return inset;
}
