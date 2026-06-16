import type { NextConfig } from 'next';
import { normalizeApiOrigin } from './src/lib/api-base';

function resolveRewriteApiOrigin(): string {
  return (
    normalizeApiOrigin(process.env.API_URL) ||
    normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:4000'
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ['@boldmeet/shared'],
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
