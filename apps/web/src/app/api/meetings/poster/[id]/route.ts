import { NextRequest, NextResponse } from 'next/server';
import { buildNestApiUrl } from '@/lib/api-base';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  let upstream: Response;
  try {
    upstream = await fetch(buildNestApiUrl(`/meetings/posters/${id}`), {
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream API unreachable';
    return NextResponse.json({ message }, { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const data = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
