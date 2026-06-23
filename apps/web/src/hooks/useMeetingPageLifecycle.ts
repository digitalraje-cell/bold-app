'use client';

import { useEffect } from 'react';

/**
 * Handles common mobile PWA lifecycle events (background, lock screen, network restore).
 * Keeps meeting UI responsive without tearing down the media session.
 */
export function useMeetingPageLifecycle(
  enabled: boolean,
  onForeground?: () => void,
) {
  useEffect(() => {
    if (!enabled || !onForeground) return;

    const handleForeground = () => {
      onForeground();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleForeground();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', handleForeground);
    window.addEventListener('focus', handleForeground);
    window.addEventListener('online', handleForeground);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', handleForeground);
      window.removeEventListener('focus', handleForeground);
      window.removeEventListener('online', handleForeground);
    };
  }, [enabled, onForeground]);
}
