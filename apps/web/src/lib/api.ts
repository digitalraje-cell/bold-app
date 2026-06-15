const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAuthToken(): Promise<string | null> {
  const res = await fetch('/api/token');
  if (!res.ok) return null;
  const data = await res.json();
  return data.token;
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

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  meetings: {
    list: (status?: string) =>
      apiFetch(`/meetings${status ? `?status=${status}` : ''}`),
    get: (id: string) => apiFetch(`/meetings/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/meetings', { method: 'POST', body: JSON.stringify(data) }),
    join: (id: string, data: { displayName: string; password?: string }) =>
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
    updateSettings: (id: string, settings: Record<string, unknown>) =>
      apiFetch(`/meetings/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
  },
};
