const DEFAULT_START_ERROR =
  'We could not start your YouTube livestream. Please try again in a moment.';

function looksLikeRawApiPayload(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true;
  if (message.includes('"error":') || message.includes('"errors":')) return true;
  if (/could not (create|bind) youtube (stream|broadcast)/i.test(message)) return true;
  if (/youtube broadcast transition/i.test(message)) return true;
  if (message.length > 200) return true;
  return false;
}

/**
 * Maps API / YouTube errors to short, user-facing copy. Logs the original for debugging.
 */
export function formatYouTubeLiveUserError(
  error: unknown,
  logLabel = 'youtube-live',
): string {
  console.error(`[${logLabel}]`, error);

  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : DEFAULT_START_ERROR;
  const lower = raw.toLowerCase();

  if (
    lower.includes('invalid_grant') ||
    lower.includes('oauth') ||
    lower.includes('reconnect your account') ||
    lower.includes('stored youtube token') ||
    lower.includes('stored youtube refresh token') ||
    (lower.includes('token') &&
      (lower.includes('expired') || lower.includes('invalid') || lower.includes('refresh')))
  ) {
    return 'Your YouTube connection has expired. Please reconnect your YouTube account in Settings → Integrations.';
  }

  if (lower.includes('stream is inactive') || lower.includes('inactive stream')) {
    return 'Unable to start livestream. The selected YouTube stream is currently inactive. Please verify your YouTube Live configuration and try again.';
  }

  if (
    lower.includes('403') ||
    lower.includes('forbidden') ||
    lower.includes('insufficient') ||
    (lower.includes('permission') && lower.includes('youtube'))
  ) {
    return 'YouTube rejected the livestream request. Please verify your YouTube account permissions.';
  }

  if (
    lower.includes('live streaming is not enabled') ||
    lower.includes('livestreamingnotenabled') ||
    lower.includes('not enabled for live streaming')
  ) {
    return 'YouTube live streaming is not enabled for this channel. Enable it in YouTube Studio, then refresh in Settings → Integrations.';
  }

  if (lower.includes('invalid state') || lower.includes('already in progress')) {
    return 'Screen capture failed to start. Stop the stream, refresh the page, and try Go Live again.';
  }

  if (lower.includes('already active for this meeting')) {
    return 'A YouTube Live session is still open for this meeting. Use Resume Stream to reconnect screen sharing, or Stop Stream to end it before starting again.';
  }

  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }

  if (lower.includes('could not load your connected youtube')) {
    return 'Could not load your connected YouTube channels. Please try again.';
  }

  if (lower.includes('no active youtube live session to resume')) {
    return 'This YouTube Live session has already ended. Stop and start a new stream if needed.';
  }

  if (looksLikeRawApiPayload(raw)) {
    return DEFAULT_START_ERROR;
  }

  if (raw.length <= 180 && !raw.includes('Network error calling')) {
    return raw;
  }

  return DEFAULT_START_ERROR;
}
