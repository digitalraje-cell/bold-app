import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOtpCode, hashOtpCode } from '@/lib/crypto';
import { getOtpExpiryDate, sendOtpEmail } from '@/lib/email';

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const email = (body.email || session?.user?.email)?.toLowerCase()?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: 'Account already verified' });
    }

    const recent = await prisma.otpVerification.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (
      recent &&
      Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return NextResponse.json(
        { error: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before resending` },
        { status: 429 },
      );
    }

    const code = generateOtpCode(6);
    await prisma.otpVerification.create({
      data: {
        email,
        codeHash: hashOtpCode(code),
        expiresAt: getOtpExpiryDate(),
      },
    });

    await sendOtpEmail(email, code);

    return NextResponse.json({ message: 'Verification code sent' });
  } catch {
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
