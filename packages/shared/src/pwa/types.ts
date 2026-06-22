export const PWA_ANALYTICS_EVENTS = [
  'PWA_INSTALL_PROMPTED',
  'PWA_INSTALLED',
  'PWA_OPENED',
  'BROWSER_JOIN_SELECTED',
] as const;

export type PwaAnalyticsEvent = (typeof PWA_ANALYTICS_EVENTS)[number];

export type BrowserName = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';

export type PwaLaunchPlatform = 'pwa' | 'android' | 'ios' | 'desktop' | 'browser';

export interface PwaAnalyticsPayload {
  event: PwaAnalyticsEvent;
  meetingId?: string;
  meetingCode?: string;
  browser?: BrowserName;
  platform?: PwaLaunchPlatform;
  metadata?: Record<string, unknown>;
}

export interface PwaAdminStats {
  totalUsers: number;
  pwaInstalledUsers: number;
  installationPercentage: number;
}
