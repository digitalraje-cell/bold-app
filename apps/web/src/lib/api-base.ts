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
 * Browser REST base URL.
 * 1. Same-origin proxy `/api/backend` (works when API_URL is set on the web service)
 * 2. Direct NEXT_PUBLIC_API_URL when set to a non-local host
 */
export function getClientApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getServerApiBaseUrl();
  }

  const direct = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
  if (direct && !isLocalOrigin(direct)) {
    return `${direct}/api`;
  }

  return `${window.location.origin}/api/backend`;
}

export function getApiBaseUrl(): string {
  return typeof window === 'undefined' ? getServerApiBaseUrl() : getClientApiBaseUrl();
}

/** Socket.io connects to the API host root (namespace appended separately). */
export function getSocketOrigin(): string {
  const configured =
    normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ||
    normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  if (configured && !isLocalOrigin(configured)) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const direct = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
    if (direct && !isLocalOrigin(direct)) {
      return direct;
    }
  }

  return getServerApiOrigin();
}

export function buildNestApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getServerApiOrigin()}/api${normalizedPath}`;
}
