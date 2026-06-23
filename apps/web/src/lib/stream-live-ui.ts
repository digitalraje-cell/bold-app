import type { StreamDisplayStatus } from '@boldmeet/shared';
import { isPwaStandalone } from '@boldmeet/shared';

export function formatStreamElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildStreamLiveSummaryLabel(input: {
  displayStatus: StreamDisplayStatus;
}): string {
  if (input.displayStatus === 'LIVE') return 'LIVE';
  if (input.displayStatus === 'CONNECTING') return 'Connecting…';
  if (input.displayStatus === 'ERROR') return 'Disconnected';
  return 'LIVE';
}

/** Desktop browser only — skip mobile UA and installed PWA standalone. */
export function shouldAutoOpenYoutubeWatchTab(): boolean {
  if (typeof window === 'undefined') return false;
  if (isPwaStandalone()) return false;
  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod|mobile|webos|blackberry|iemobile|opera mini/i.test(ua)) {
    return false;
  }
  return true;
}

export function openYoutubeWatchTab(url: string): boolean {
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!tab) return false;
  try {
    if (tab.closed) return false;
  } catch {
    // Cross-origin access may throw; treat non-null as success.
  }
  return true;
}
