/** YouTube Live is gated by plan permission (canStreamToYoutube), not a deployment flag. */
export function isYouTubeLiveEnabled(): boolean {
  return true;
}
