import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyOtpCode } from '@/lib/otp-service';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json().catch(() => ({}));
    const email = (body.email || session?.user?.email)?.toLowerCase()?.trim();
    const code = String(body.code || '').trim();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (email !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    console.log('[otp-api] POST /verify', { email });
    const result = await verifyOtpCode(email, code);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ message: result.message, verified: true });
  } catch (error) {
    console.error('[otp-api] POST /verify unexpected error', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
