const LOCAL_API = 'http://localhost:4000';

/** Strip trailing slashes and a trailing `/api` segment from an API origin. */
export function normalizeApiOrigin(value?: string | null): string | null {
  if (!value?.trim()) return null;
  let trimmed = value.trim().replace(/\/$/, '');
  if (trimmed.endsWith('/api')) {
    trimmed = trimmed.slice(0, -4);
  }
  return trimmed || null;
}

function readEnvOrigin(...keys: string[]): string | null {
  for (const key of keys) {
    const normalized = normalizeApiOrigin(process.env[key]);
    if (normalized) return normalized;
  }
  return null;
}

/** Server-side Nest API origin (no /api suffix). */
export function getServerApiOrigin(): string {
  return (
    readEnvOrigin('API_URL', 'NEXT_PUBLIC_API_URL', 'RAILWAY_SERVICE_BOLD_API_URL') ||
    LOCAL_API
  );
}

/** Full REST base including the Nest global `/api` prefix. */
export function getServerApiBaseUrl(): string {
  return `${getServerApiOrigin()}/api`;
}

function isLocalOrigin(origin: string): boolean {
  return (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.startsWith('http://0.0.0.0')
  );
}

/**
 * Browser REST always uses the same-origin Next.js proxy to avoid CORS failures.
 * Server code talks to API_URL directly.
 */
export function getClientApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getServerApiBaseUrl();
  }
  return `${window.location.origin}/api/backend`;
}

export function getApiBaseUrl(): string {
  return typeof window === 'undefined' ? getServerApiBaseUrl() : getClientApiBaseUrl();
}

export function getClientApiTransport(): 'proxy' | 'direct-server' {
  return typeof window === 'undefined' ? 'direct-server' : 'proxy';
}

/** Socket.io must connect to the API host (cannot use HTTP rewrite proxy). */
export function getSocketOrigin(): string {
  const configured =
    normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ||
    normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    (typeof window === 'undefined' ? getServerApiOrigin() : null);

  if (configured && !isLocalOrigin(configured)) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const fallback = getServerApiOrigin();
    if (isLocalOrigin(fallback) && !isLocalOrigin(window.location.origin)) {
      console.error(
        '[youtube-live-pipeline] socket-origin:misconfigured',
        JSON.stringify({
          resolved: fallback,
          webOrigin: window.location.origin,
          hint: 'Set NEXT_PUBLIC_SOCKET_URL (or API_URL at web build) to the Nest API origin',
        }),
      );
    }
    return fallback;
  }

  return getServerApiOrigin();
}

export function buildNestApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getServerApiOrigin()}/api${normalizedPath}`;
}
