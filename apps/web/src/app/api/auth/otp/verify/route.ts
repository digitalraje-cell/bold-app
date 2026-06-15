import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashOtpCode } from '@/lib/crypto';

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const email = (body.email || session?.user?.email)?.toLowerCase()?.trim();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const otp = await prisma.otpVerification.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json({ error: 'No active verification code found' }, { status: 404 });
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
    }

    const isValid = otp.codeHash === hashOtpCode(code);

    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.otpVerification.update({
        where: { id: otp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email },
        data: { isVerified: true, verifiedAt: new Date(), emailVerified: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Account verified successfully', verified: true });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
