const LOCAL_DEV_ORIGIN = 'http://localhost:3000';

/** Bracket access avoids Next.js build-time inlining issues for runtime env. */
function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const protocol = trimmed.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${trimmed}`;
}

function readOriginEnv(key: string): string | undefined {
  const value = readEnv(key);
  return value ? normalizeOrigin(value) : undefined;
}

function domainEnvToOrigin(): string | undefined {
  const domain = readEnv('NEXT_PUBLIC_APP_DOMAIN');
  return domain ? normalizeOrigin(domain) : undefined;
}

/** Never use Railway deploy hostnames in user-facing invite links. */
function isInternalDeployOrigin(origin: string): boolean {
  return origin.includes('.railway.app');
}

function resolveConfiguredOrigin(): string | undefined {
  return (
    readOriginEnv('NEXT_PUBLIC_APP_URL') ||
    readOriginEnv('AUTH_URL') ||
    readOriginEnv('NEXTAUTH_URL') ||
    domainEnvToOrigin()
  );
}

/** Server/runtime origin — used in layouts, SSR, and metadataBase. */
export function getServerAppOrigin(): string {
  return resolveConfiguredOrigin() || LOCAL_DEV_ORIGIN;
}

/**
 * Client origin for invite/copy links.
 * Priority: NEXT_PUBLIC_APP_URL → AUTH/NEXTAUTH → APP_DOMAIN → window.location.origin
 */
export function getClientAppOrigin(): string {
  const configured = resolveConfiguredOrigin();
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    if (!isInternalDeployOrigin(origin)) {
      return origin;
    }
  }

  return getServerAppOrigin();
}

export function getAppOrigin(): string {
  return typeof window !== 'undefined' ? getClientAppOrigin() : getServerAppOrigin();
}
