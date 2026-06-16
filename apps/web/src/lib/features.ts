/**
 * Phase feature flags — YouTube Live is Phase 1.5; keep disabled in production until stable.
 */
export function isYouTubeLiveEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE === 'true';
}
