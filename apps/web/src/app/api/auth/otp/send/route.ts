import { NextResponse } from 'next/server';
import { sendAuthOtp } from '@/lib/otp-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '')
      .toLowerCase()
      .trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[otp-api] POST /send', { email });
    const result = await sendAuthOtp(email);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfterSeconds: result.retryAfterSeconds },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('[otp-api] POST /send unexpected error', error);
    return NextResponse.json({ error: 'Failed to send login code' }, { status: 500 });
  }
}
