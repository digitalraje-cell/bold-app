import { NextResponse } from 'next/server';
import { buildNestApiUrl, getServerApiOrigin } from '@/lib/api-base';

export const runtime = 'nodejs';

/** Lightweight proxy health check for debugging production API wiring. */
export async function GET() {
  const origin = getServerApiOrigin();
  const healthUrl = buildNestApiUrl('/health');

  try {
    const res = await fetch(healthUrl, { cache: 'no-store' });
    const body = await res.text();

    return NextResponse.json({
      proxy: 'ok',
      apiOrigin: origin,
      healthUrl,
      upstreamStatus: res.status,
      upstreamOk: res.ok,
      upstreamBody: body.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'fetch failed';
    return NextResponse.json(
      {
        proxy: 'error',
        apiOrigin: origin,
        healthUrl,
        message: `Could not reach API at ${origin}. Set API_URL on the web service.`,
        detail: message,
      },
      { status: 502 },
    );
  }
}
