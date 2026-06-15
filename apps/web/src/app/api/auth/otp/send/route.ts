import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendVerificationOtp } from '@/lib/otp-service';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json().catch(() => ({}));
    const email = (body.email || session?.user?.email)?.toLowerCase()?.trim();

    if (!session?.user?.email) {
      console.error('[otp-api] POST /send rejected: unauthenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (email !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    console.log('[otp-api] POST /send', { email });
    const result = await sendVerificationOtp(email);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('[otp-api] POST /send unexpected error', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
