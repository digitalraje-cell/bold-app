import { buildNestApiUrl } from '@/lib/api-base';
import type { PublicMeetingPreview } from '@/components/meeting/MeetingLobby';

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function formatApiError(body: ApiErrorBody | null, status: number, rawBody: string): string {
  if (body?.message) {
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  }
  if (body?.error && typeof body.error === 'string') return body.error;
  if (rawBody.trim() && !rawBody.trim().startsWith('<!DOCTYPE')) {
    return rawBody.trim().slice(0, 300);
  }
  return `API error ${status}`;
}

export async function fetchPublicMeetingServer(
  meetingIdOrCode: string,
): Promise<PublicMeetingPreview> {
  const url = buildNestApiUrl(`/meetings/${encodeURIComponent(meetingIdOrCode)}/public`);

  console.log('[api-server] GET public meeting', { url, meetingIdOrCode });

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    console.error('[api-server] public meeting fetch failed', { url, message });
    throw new Error(
      `Could not reach meeting API (${message}). Set API_URL on the web service to your Railway API URL.`,
    );
  }

  const rawBody = await res.text();
  let body: ApiErrorBody | null = null;
  try {
    body = rawBody ? (JSON.parse(rawBody) as ApiErrorBody) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = formatApiError(body, res.status, rawBody);
    console.error('[api-server] public meeting error', { url, status: res.status, message });
    throw new Error(message);
  }

  return JSON.parse(rawBody) as PublicMeetingPreview;
}
