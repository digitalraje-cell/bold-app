import type { BrowserName } from './types';

export function detectBrowser(userAgent: string): BrowserName {
  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox';
  if (
    (ua.includes('safari') || ua.includes('iphone') || ua.includes('ipad')) &&
    !ua.includes('chrome') &&
    !ua.includes('crios') &&
    !ua.includes('chromium')
  ) {
    return 'safari';
  }
  if (ua.includes('chrome') || ua.includes('crios') || ua.includes('chromium')) {
    return 'chrome';
  }

  return 'other';
}

export function getBrowserContinueLabel(browser: BrowserName): string {
  switch (browser) {
    case 'chrome':
      return 'Continue in Chrome';
    case 'edge':
      return 'Continue in Edge';
    case 'safari':
      return 'Continue in Safari';
    case 'firefox':
      return 'Continue in Firefox';
    default:
      return 'Continue in Browser';
  }
}

export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}
