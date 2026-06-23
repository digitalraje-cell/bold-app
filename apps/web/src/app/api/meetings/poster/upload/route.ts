import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildNestApiUrl } from '@/lib/api-base';
import { createServerApiJwt } from '@/lib/server-api-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function parseUpstreamError(res: Response): Promise<string> {
  const rawBody = await res.text();
  try {
    const body = rawBody ? (JSON.parse(rawBody) as { message?: string | string[] }) : null;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
  } catch {
    // fall through
  }
  if (rawBody.trim()) return rawBody.trim().slice(0, 300);
  return `Poster upload failed (${res.status})`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = await createServerApiJwt({
    userId: session.user.id,
    email: session.user.email,
  });
  if (!token) {
    return NextResponse.json({ message: 'Server auth misconfigured' }, { status: 500 });
  }

  const formData = await request.formData();
  const poster = formData.get('poster');
  if (!(poster instanceof Blob) || poster.size === 0) {
    return NextResponse.json({ message: 'Poster file is required' }, { status: 400 });
  }

  const forward = new FormData();
  forward.append('poster', poster, 'meeting-poster');

  let upstream: Response;
  try {
    upstream = await fetch(buildNestApiUrl('/meetings/posters/upload'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: forward,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream API unreachable';
    return NextResponse.json({ message }, { status: 502 });
  }

  if (!upstream.ok) {
    const message = await parseUpstreamError(upstream);
    return NextResponse.json({ message }, { status: upstream.status });
  }

  const payload = (await upstream.json()) as {
    id: string;
    posterUrl: string;
    mimeType: string;
    sizeBytes: number;
  };

  return NextResponse.json({
    ...payload,
    posterUrl: `/api/meetings/poster/${payload.id}`,
  });
}
