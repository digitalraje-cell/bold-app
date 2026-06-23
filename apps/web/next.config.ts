import type { NextConfig } from 'next';
import {
  resolveClientBundleApiOrigin,
  resolveSocketBundleApiOrigin,
} from './src/lib/api-base';

const clientPublicApiOrigin = resolveClientBundleApiOrigin();
const socketPublicApiOrigin = resolveSocketBundleApiOrigin();

const nextConfig: NextConfig = {
  transpilePackages: ['@boldmeet/shared'],
  env: {
    NEXT_PUBLIC_API_URL: clientPublicApiOrigin,
    NEXT_PUBLIC_SOCKET_URL: socketPublicApiOrigin,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
  },
  async rewrites() {
    const apiOrigin = resolveClientBundleApiOrigin();
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
