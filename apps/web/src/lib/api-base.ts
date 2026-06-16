const LOCAL_API = 'http://localhost:4000';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Server-side Nest API origin (no /api suffix). */
export function getServerApiOrigin(): string {
  return stripTrailingSlash(
    process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      LOCAL_API,
  );
}

/**
 * Browser calls go through the same-origin Next.js proxy to avoid CORS and
 * misconfigured NEXT_PUBLIC_API_URL at build time. Server code uses API_URL directly.
 */
export function getClientApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `${getServerApiOrigin()}/api`;
  }
  return `${window.location.origin}/api/backend`;
}

export function getApiBaseUrl(): string {
  return typeof window === 'undefined'
    ? `${getServerApiOrigin()}/api`
    : getClientApiBaseUrl();
}
