import { isIosDevice } from './browser';

/** Legacy iOS Safari “Add to Home Screen” standalone flag. */
function isIosStandaloneNavigator(nav: Navigator): boolean {
  return (nav as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * True when the app runs as an installed PWA (standalone / minimal-ui / iOS home screen).
 * Safe to call during SSR — returns false without `window`.
 */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (isIosStandaloneNavigator(window.navigator)) return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  );
}

/** Fullscreen display mode (browser F11 or immersive PWA). Used for diagnostics only. */
export function isFullscreenDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: fullscreen)').matches;
}

export function isAndroidUserAgent(userAgent: string): boolean {
  return /android/i.test(userAgent);
}

export function isMobileUserAgent(userAgent: string): boolean {
  return (
    isIosDevice(userAgent) ||
    isAndroidUserAgent(userAgent) ||
    /mobile|webos|blackberry|iemobile|opera mini/i.test(userAgent)
  );
}

/** Touch-first narrow viewport — used for responsive meeting UI, not PWA install state. */
export function isCoarsePointerMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse) and (max-width: 768px)').matches;
}

export function isMobileEnvironment(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return isMobileUserAgent(userAgent) || isCoarsePointerMobileViewport();
}

export type RuntimeSurface =
  | 'browser-desktop'
  | 'browser-mobile'
  | 'pwa-desktop'
  | 'pwa-mobile';

/**
 * Classifies the current client for analytics, capability gates, and QA matrices.
 * PWA vs browser is install/display mode; mobile vs desktop is viewport + UA.
 */
export function getRuntimeSurface(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): RuntimeSurface {
  const pwa = isPwaStandalone();
  const mobile = isMobileEnvironment(userAgent);
  if (pwa && mobile) return 'pwa-mobile';
  if (pwa) return 'pwa-desktop';
  if (mobile) return 'browser-mobile';
  return 'browser-desktop';
}
