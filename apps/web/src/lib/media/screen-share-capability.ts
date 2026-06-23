import {
  isAndroidUserAgent,
  isIosDevice,
  isMobileEnvironment,
  isPwaStandalone,
} from '@boldmeet/shared';

export type ScreenShareCapability = {
  supported: boolean;
  reason: string | null;
  hasGetDisplayMedia: boolean;
  hasMediaDevices: boolean;
  isMobile: boolean;
  isAndroid: boolean;
  isIos: boolean;
  isPwa: boolean;
  userAgent: string;
};

export function detectScreenShareCapability(): ScreenShareCapability {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = isAndroidUserAgent(userAgent);
  const isIos = isIosDevice(userAgent);
  const isMobile = isMobileEnvironment(userAgent);
  const isPwa = isPwaStandalone();

  const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
  const hasGetDisplayMedia =
    hasMediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function';

  let supported = hasGetDisplayMedia;
  let reason: string | null = null;

  if (!hasMediaDevices) {
    supported = false;
    reason = 'MediaDevices API is not available in this browser.';
  } else if (!hasGetDisplayMedia) {
    supported = false;
    reason = isMobile
      ? 'Screen sharing is not supported in mobile browsers. Join from desktop Chrome or Edge to share your screen.'
      : 'Screen sharing is not supported in this browser. Try Chrome or Edge on desktop.';
  } else if (isAndroid) {
    supported = false;
    reason = isPwa
      ? 'Screen sharing is not available in the Android app. Open this meeting in desktop Chrome or Edge to share your screen.'
      : 'Screen sharing is not supported on Android. Use desktop Chrome or Edge instead.';
  } else if (isIos) {
    supported = false;
    reason =
      'Screen sharing is not supported on iPhone or iPad. Use desktop Chrome or Edge instead.';
  }

  return {
    supported,
    reason,
    hasGetDisplayMedia,
    hasMediaDevices,
    isMobile,
    isAndroid,
    isIos,
    isPwa,
    userAgent,
  };
}

export function getScreenShareUnsupportedMessage(capability = detectScreenShareCapability()): string {
  return (
    capability.reason ??
    'Screen sharing is not available in this browser. Try Chrome or Edge on desktop.'
  );
}
