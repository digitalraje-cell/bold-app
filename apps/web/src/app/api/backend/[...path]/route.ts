import { NextRequest, NextResponse } from 'next/server';
import { buildNestApiUrl, getServerApiOrigin } from '@/lib/api-base';

export const runtime = 'nodejs';

const FORWARD_HEADERS = ['authorization', 'content-type', 'accept'];

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<NextResponse> {
  const { path } = await params;
  const apiOrigin = getServerApiOrigin();
  const targetPath = path.join('/');
  const targetUrl = buildNestApiUrl(`/${targetPath}${request.nextUrl.search}`);

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  console.log('[api-proxy]', request.method, targetUrl);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream API unreachable';
    console.error('[api-proxy] fetch failed', { targetUrl, message });
    return NextResponse.json(
      {
        message: `Could not reach meeting API (${message}). Check API_URL on the web service.`,
        statusCode: 502,
        path: targetPath,
      },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';

  if (!upstream.ok) {
    console.error('[api-proxy] upstream error', {
      targetUrl,
      status: upstream.status,
      body: body.slice(0, 500),
    });
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': contentType },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context.params);
}
