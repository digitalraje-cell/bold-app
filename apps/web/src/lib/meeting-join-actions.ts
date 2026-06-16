'use server';

import { SignJWT } from 'jose';
import { normalizeMeetingCode } from '@boldmeet/shared';
import { auth } from '@/lib/auth';
import { buildNestApiUrl } from '@/lib/api-base';

type JoinMeetingResponse = {
  admitted: boolean;
  meeting: { id: string; meetingCode?: string };
  participant?: { id: string; displayName: string };
};

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

function formatError(body: ApiErrorBody | null, status: number, rawBody: string): string {
  if (body?.message) {
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  }
  if (body?.error) return body.error;
  if (rawBody.trim() && !rawBody.trim().startsWith('<!DOCTYPE')) {
    return rawBody.trim().slice(0, 300);
  }
  return `API error ${status}`;
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return {};
  }

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

export type JoinMeetingActionResult =
  | {
      ok: true;
      path: string;
      meetingId: string;
      routeId: string;
      participantId?: string;
      displayName: string;
      admitted: boolean;
    }
  | { ok: false; error: string };

/** Server-side join — avoids browser CORS / cross-origin fetch failures for guests. */
export async function joinMeetingAction(
  meetingIdOrCode: string,
  displayName: string,
  password?: string,
): Promise<JoinMeetingActionResult> {
  const payload: { displayName: string; password?: string } = { displayName };
  if (password) payload.password = password;

  const url = buildNestApiUrl(`/meetings/${encodeURIComponent(meetingIdOrCode)}/join`);
  const authHeaders = await buildAuthHeaders();

  console.log('[meeting-join-action] POST', url, {
    meetingIdOrCode,
    displayName,
    hasPassword: Boolean(password),
    authenticated: Boolean(authHeaders.Authorization),
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    console.error('[meeting-join-action] network error', { url, message });
    return {
      ok: false,
      error: `Could not reach meeting API (${message}). Check API_URL on the web service.`,
    };
  }

  const rawBody = await res.text();
  let body: ApiErrorBody | null = null;
  try {
    body = rawBody ? (JSON.parse(rawBody) as ApiErrorBody) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const error = formatError(body, res.status, rawBody);
    console.error('[meeting-join-action] upstream error', { url, status: res.status, error });
    return { ok: false, error };
  }

  const result = JSON.parse(rawBody) as JoinMeetingResponse;
  const internalMeetingId = result.meeting?.id ?? meetingIdOrCode;
  const routeId = result.meeting?.meetingCode || normalizeMeetingCode(meetingIdOrCode) || internalMeetingId;
  const path = result.admitted
    ? `/meeting/${routeId}/room`
    : `/meeting/${routeId}/waiting`;

  console.log('[meeting-join-action] success', {
    meetingId: internalMeetingId,
    routeId,
    participantId: result.participant?.id,
    admitted: result.admitted,
    path,
  });

  return {
    ok: true,
    path,
    meetingId: internalMeetingId,
    routeId,
    participantId: result.participant?.id,
    displayName: result.participant?.displayName || displayName,
    admitted: result.admitted,
  };
}
