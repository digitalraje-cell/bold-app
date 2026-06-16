import { SignJWT } from 'jose';
import { buildNestApiUrl } from '@/lib/api-base';
import { auth } from '@/lib/auth';
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

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return {};

  const secret =
    process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return {};

  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));

  return { Authorization: `Bearer ${token}` };
}

/** Authenticated meeting fetch — used when public payload lacks host fields. */
export async function fetchAuthenticatedMeetingServer(
  meetingIdOrCode: string,
): Promise<{ id: string; hostId: string; jitsiRoom: string; title: string; meetingCode: string }> {
  const url = buildNestApiUrl(`/meetings/${encodeURIComponent(meetingIdOrCode)}`);
  const authHeaders = await buildAuthHeaders();
  if (!authHeaders.Authorization) {
    throw new Error('Authentication required');
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...authHeaders },
    cache: 'no-store',
  });

  const rawBody = await res.text();
  if (!res.ok) {
    throw new Error(formatApiError(null, res.status, rawBody));
  }

  return JSON.parse(rawBody) as {
    id: string;
    hostId: string;
    jitsiRoom: string;
    title: string;
    meetingCode: string;
  };
}

export function resolveJitsiRoom(meeting: Pick<PublicMeetingPreview, 'meetingCode' | 'jitsiRoom'>): string {
  return meeting.jitsiRoom || `boldmeet-${meeting.meetingCode}`;
}
