import { prisma } from './prisma';
import { generateOtpCode, hashOtpCode } from './crypto';
import { getOtpExpiryDate, sendOtpEmail } from './email';

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export type OtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status?: number };

export async function sendVerificationOtp(email: string): Promise<OtpResult> {
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail) {
    return { ok: false, error: 'Email is required', status: 400 };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    console.error('[otp] send failed: user not found', normalizedEmail);
    return { ok: false, error: 'Account not found', status: 404 };
  }

  if (user.isVerified) {
    return { ok: true, message: 'Account already verified' };
  }

  const recent = await prisma.otpVerification.findFirst({
    where: { email: normalizedEmail, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return {
      ok: false,
      error: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before resending`,
      status: 429,
    };
  }

  const code = generateOtpCode(6);

  await prisma.otpVerification.create({
    data: {
      email: normalizedEmail,
      codeHash: hashOtpCode(code),
      expiresAt: getOtpExpiryDate(),
    },
  });

  try {
    await sendOtpEmail(normalizedEmail, code);
    console.log('[otp] verification code sent', { email: normalizedEmail });
    return { ok: true, message: 'Verification code sent to your email' };
  } catch (error) {
    console.error('[otp] SMTP send failed', {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { ok: false, error: 'Failed to send verification email. Check SMTP settings.', status: 500 };
  }
}

export async function verifyOtpCode(email: string, code: string): Promise<OtpResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = String(code || '').trim();

  if (!normalizedEmail || !normalizedCode) {
    return { ok: false, error: 'Email and code are required', status: 400 };
  }

  const otp = await prisma.otpVerification.findFirst({
    where: { email: normalizedEmail, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { ok: false, error: 'No active verification code found', status: 404 };
  }

  if (otp.expiresAt < new Date()) {
    return { ok: false, error: 'Verification code expired', status: 400 };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many attempts. Request a new code.', status: 429 };
  }

  const isValid = otp.codeHash === hashOtpCode(normalizedCode);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: 'Invalid verification code', status: 400 };
  }

  await prisma.$transaction([
    prisma.otpVerification.update({
      where: { id: otp.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { isVerified: true, verifiedAt: new Date(), emailVerified: new Date() },
    }),
  ]);

  console.log('[otp] account verified', { email: normalizedEmail });
  return { ok: true, message: 'Account verified successfully' };
}
