import { getApiBaseUrl, getClientApiTransport } from '@/lib/api-base';

async function getAuthToken(): Promise<string | null> {
  const res = await fetch('/api/token');
  if (!res.ok) return null;
  const data = await res.json();
  return data.token;
}

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function formatApiError(body: ApiErrorBody | null, status: number, rawBody: string): string {
  if (body?.message) {
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  }

  if (body?.error && typeof body.error === 'string') {
    return body.error;
  }

  if (rawBody.trim()) {
    const trimmed = rawBody.trim().slice(0, 300);
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return `API route not found (${status}). If this persists after deploy, set API_URL on the web service.`;
    }
    return trimmed;
  }

  return `API error ${status}`;
}

async function parseErrorResponse(res: Response): Promise<{ message: string; rawBody: string }> {
  const rawBody = await res.text();
  let body: ApiErrorBody | null = null;

  try {
    body = rawBody ? (JSON.parse(rawBody) as ApiErrorBody) : null;
  } catch {
    body = null;
  }

  return {
    message: formatApiError(body, res.status, rawBody),
    rawBody,
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${getApiBaseUrl()}${path}`;
  const method = options.method || 'GET';
  const transport = getClientApiTransport();

  console.log('[api]', method, url, { transport, auth: auth ? 'optional' : 'none' });

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    console.error('[api] network error', { method, url, message });
    throw new Error(`Network error calling ${method} ${path}: ${message}`);
  }

  if (!res.ok) {
    const { message, rawBody } = await parseErrorResponse(res);
    console.error('[api] request failed', {
      method,
      url,
      status: res.status,
      message,
      body: rawBody.slice(0, 500),
    });
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  meetings: {
    list: (status?: string) =>
      apiFetch(`/meetings${status ? `?status=${status}` : ''}`),
    getPublic: (id: string) => apiFetch(`/meetings/${id}/public`, {}, false),
    get: (id: string) => apiFetch(`/meetings/${id}`),
    getInvite: (id: string) => apiFetch(`/meetings/${id}/invite`),
    getDuration: (id: string) => apiFetch(`/meetings/${id}/duration`, {}, false),
    getJitsiToken: (id: string, data?: { participantId?: string }) =>
      apiFetch<{
        jwtEnabled: boolean;
        token: string | null;
        domain: string;
        expiresAt: number | null;
        moderatorPassword: string | null;
      }>(`/meetings/${id}/jitsi-token`, {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      }, false),
    create: (data: Record<string, unknown>) =>
      apiFetch('/meetings', { method: 'POST', body: JSON.stringify(data) }),
    join: (id: string, data: {
      displayName: string;
      password?: string;
      viaDirectLink?: boolean;
      participantId?: string;
      registrantEmail?: string;
    }) =>
      apiFetch(`/meetings/${id}/join`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, false),
    joinByCode: (data: { meetingCode: string; displayName: string; password?: string }) =>
      apiFetch('/meetings/join-by-code', {
        method: 'POST',
        body: JSON.stringify(data),
      }, false),
    findByCode: (code: string) => apiFetch(`/meetings/code/${code}`, {}, false),
    end: (id: string) => apiFetch(`/meetings/${id}/end`, { method: 'POST' }),
    leave: (id: string) => apiFetch(`/meetings/${id}/leave`, { method: 'POST' }),
    leaveGuest: (id: string, participantId: string) =>
      apiFetch(`/meetings/${id}/leave-guest`, {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      }, false),
    register: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/meetings/${id}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, false),
    listRegistrants: (id: string) => apiFetch(`/meetings/${id}/registrants`),
    lock: (id: string, isLocked: boolean) =>
      apiFetch(`/meetings/${id}/lock`, {
        method: 'POST',
        body: JSON.stringify({ isLocked }),
      }),
    updateSettings: (id: string, settings: Record<string, unknown>) =>
      apiFetch(`/meetings/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
  },
  subscriptions: {
    me: () => apiFetch('/subscriptions/me'),
  },
  participants: {
    list: (meetingId: string) => apiFetch(`/meetings/${meetingId}/participants`),
    mute: (meetingId: string, participantId: string, isMuted: boolean) =>
      apiFetch(`/meetings/${meetingId}/participants/${participantId}/mute`, {
        method: 'PATCH',
        body: JSON.stringify({ isMuted }),
      }),
    remove: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/participants/${participantId}/remove`, {
        method: 'POST',
      }),
    makeCoHost: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/participants/${participantId}/make-cohost`, {
        method: 'POST',
      }),
    removeCoHost: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/participants/${participantId}/remove-cohost`, {
        method: 'POST',
      }),
    transferHost: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/participants/${participantId}/transfer-host`, {
        method: 'POST',
      }),
    admitWaiting: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/participants/waiting/${participantId}/admit`, {
        method: 'POST',
      }),
  },
  stream: {
    get: (meetingId: string) => apiFetch(`/meetings/${meetingId}/stream`),
    getPublic: (meetingId: string) =>
      apiFetch(`/meetings/${meetingId}/stream/public`, {}, false),
    start: (
      meetingId: string,
      data: {
        provider: string;
        title: string;
        rtmpUrl?: string;
        streamKey: string;
        watchUrl?: string;
      },
    ) =>
      apiFetch(`/meetings/${meetingId}/stream/start`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    stop: (meetingId: string) =>
      apiFetch(`/meetings/${meetingId}/stream/stop`, { method: 'POST' }),
  },
  room: {
    get: (meetingId: string) => apiFetch(`/meetings/${meetingId}/room`, {}, false),
    switchMode: (meetingId: string, roomMode: string) =>
      apiFetch(`/meetings/${meetingId}/room/mode`, {
        method: 'PATCH',
        body: JSON.stringify({ roomMode }),
      }),
    updateChatMode: (meetingId: string, chatMode: string, chatEnabled?: boolean) =>
      apiFetch(`/meetings/${meetingId}/room/chat-mode`, {
        method: 'PATCH',
        body: JSON.stringify({ chatMode, chatEnabled }),
      }),
    promotePanelist: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/room/participants/${participantId}/panelist`, {
        method: 'POST',
      }),
    bringOnStage: (
      meetingId: string,
      participantId: string,
      options: { micAllowed?: boolean; cameraAllowed?: boolean },
    ) =>
      apiFetch(`/meetings/${meetingId}/room/participants/${participantId}/stage`, {
        method: 'POST',
        body: JSON.stringify(options),
      }),
    removeFromStage: (meetingId: string, participantId: string) =>
      apiFetch(`/meetings/${meetingId}/room/participants/${participantId}/stage/remove`, {
        method: 'POST',
      }),
  },
};
