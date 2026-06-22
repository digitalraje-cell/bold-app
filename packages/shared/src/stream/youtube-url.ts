/** Public YouTube live watch URL for a connected channel (best-effort without Data API). */
export function buildYouTubeWatchUrl(options?: {
  channelId?: string | null;
  channelUrl?: string | null;
}): string {
  const channelId = options?.channelId?.trim();
  if (channelId) {
    return `https://www.youtube.com/channel/${channelId}/live`;
  }

  const channelUrl = options?.channelUrl?.trim();
  if (channelUrl) {
    const base = channelUrl.replace(/\/$/, '');
    if (base.includes('/channel/') || base.includes('/@')) {
      return `${base}/live`;
    }
    return `${base}/live`;
  }

  return 'https://www.youtube.com/live';
}

export function buildYouTubeStudioLiveUrl(channelId?: string | null): string {
  if (channelId?.trim()) {
    return `https://studio.youtube.com/channel/${channelId.trim()}/livestreaming`;
  }
  return 'https://studio.youtube.com/channel/livestreaming';
}
