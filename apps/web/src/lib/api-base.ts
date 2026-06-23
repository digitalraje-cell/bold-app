/** Production Nest API origin (Socket.IO + server-side fallback). */
export const PRODUCTION_API_ORIGIN = 'https://boldmeetapi-production.up.railway.app';

const DEV_API_PORT = 4000;

function devApiOrigin(): string {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${DEV_API_PORT}`;
  }
  return `http://127.0.0.1:${DEV_API_PORT}`;
}

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

/**
 * Client bundle env — must use static process.env.NEXT_PUBLIC_* property access
 * so Next.js inlines values at build time (dynamic process.env[key] stays undefined).
 */
function readPublicClientEnvOrigin(): string | null {
  return (
    resolveApiOriginForEnvironment(normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL)) ||
    resolveApiOriginForEnvironment(normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL)) ||
    null
  );
}

function isLocalOrigin(origin: string): boolean {
  return (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.startsWith('http://0.0.0.0')
  );
}

/** Production builds and non-local browsers must never use a local API origin. */
export function resolveApiOriginForEnvironment(origin: string | null): string | null {
  if (!origin) return null;
  if (process.env.NODE_ENV === 'production' && isLocalOrigin(origin)) {
    return PRODUCTION_API_ORIGIN;
  }
  if (
    typeof window !== 'undefined' &&
    !isLocalOrigin(window.location.origin) &&
    isLocalOrigin(origin)
  ) {
    return PRODUCTION_API_ORIGIN;
  }
  return origin;
}

function resolveConfiguredPublicApiOrigin(): string | null {
  return readPublicClientEnvOrigin();
}

/** Origin inlined into the client bundle at build time. */
export function resolveClientBundleApiOrigin(): string {
  const configured = resolveConfiguredPublicApiOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_ORIGIN;
  }
  return devApiOrigin();
}

/** Socket.IO origin inlined into the client bundle at build time. */
export function resolveSocketBundleApiOrigin(): string {
  const socketOnly = resolveApiOriginForEnvironment(
    normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL),
  );
  if (socketOnly) return socketOnly;
  return resolveClientBundleApiOrigin();
}

/** Server-side Nest API origin (no /api suffix). */
export function getServerApiOrigin(): string {
  const configured = resolveApiOriginForEnvironment(
    readEnvOrigin('API_URL', 'NEXT_PUBLIC_API_URL', 'RAILWAY_SERVICE_BOLD_API_URL'),
  );
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_ORIGIN;
  }
  return devApiOrigin();
}

/** Full REST base including the Nest global `/api` prefix. */
export function getServerApiBaseUrl(): string {
  return `${getServerApiOrigin()}/api`;
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

/**
 * Socket.io must connect to the API host (cannot use HTTP rewrite proxy).
 * Never returns localhost when the page is served from a non-local origin.
 */
export function getSocketOrigin(): string {
  const configured = resolveConfiguredPublicApiOrigin();
  let origin: string;

  if (configured) {
    origin = configured;
  } else if (typeof window !== 'undefined') {
    origin = isLocalOrigin(window.location.origin)
      ? devApiOrigin()
      : PRODUCTION_API_ORIGIN;
  } else if (process.env.NODE_ENV === 'production') {
    origin = PRODUCTION_API_ORIGIN;
  } else {
    origin = devApiOrigin();
  }

  console.info('[socket] resolved origin:', origin);
  return origin;
}

export function buildNestApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getServerApiOrigin()}/api${normalizedPath}`;
}
