'use server';

import { buildNestApiUrl } from '@/lib/api-base';

type JoinMeetingResponse = {
  admitted: boolean;
  meeting: { id: string };
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

export type JoinMeetingActionResult =
  | {
      ok: true;
      path: string;
      meetingId: string;
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

  console.log('[meeting-join-action] POST', url, {
    meetingIdOrCode,
    displayName,
    hasPassword: Boolean(password),
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
  const meetingId = result.meeting?.id ?? meetingIdOrCode;
  const path = result.admitted
    ? `/meeting/${meetingId}/room`
    : `/meeting/${meetingId}/waiting`;

  console.log('[meeting-join-action] success', {
    meetingId,
    participantId: result.participant?.id,
    admitted: result.admitted,
    path,
  });

  return {
    ok: true,
    path,
    meetingId,
    participantId: result.participant?.id,
    displayName: result.participant?.displayName || displayName,
    admitted: result.admitted,
  };
}
