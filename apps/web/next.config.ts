import type { NextConfig } from 'next';
import { normalizeApiOrigin, PRODUCTION_API_ORIGIN } from './src/lib/api-base';

function resolveConfiguredApiOrigin(): string | null {
  return (
    normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ||
    normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeApiOrigin(process.env.API_URL) ||
    null
  );
}

/** Server rewrites + SSR: dev-only fallback when no API_URL is configured. */
function localDevRewriteOrigin(): string {
  return 'http://127.0.0.1:4000';
}

function resolveRewriteApiOrigin(): string {
  return resolveConfiguredApiOrigin() || localDevRewriteOrigin();
}

/**
 * Values inlined into the client bundle. Production builds must not bake localhost.
 */
function resolveClientPublicApiOrigin(): string {
  const configured = resolveConfiguredApiOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_ORIGIN;
  }
  return localDevRewriteOrigin();
}

const clientPublicApiOrigin = resolveClientPublicApiOrigin();

const nextConfig: NextConfig = {
  transpilePackages: ['@boldmeet/shared'],
  env: {
    NEXT_PUBLIC_API_URL: clientPublicApiOrigin,
    NEXT_PUBLIC_SOCKET_URL:
      normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ||
      clientPublicApiOrigin,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
  },
  async rewrites() {
    const apiOrigin = resolveRewriteApiOrigin();
    return {
      beforeFiles: [
        {
          // Require at least one segment so GET /api/backend hits the health route handler.
          source: '/api/backend/:path+',
          destination: `${apiOrigin}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
