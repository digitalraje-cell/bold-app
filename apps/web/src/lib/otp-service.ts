import { prisma } from './prisma';
import { generateOtpCode, hashOtpCode } from './crypto';
import { getOtpExpiryDate, sendOtpEmail } from './email';

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function logOtpRuntime(): void {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    console.log('[otp] runtime = nodejs');
  }
}

export type OtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status?: number };

export async function sendVerificationOtp(email: string): Promise<OtpResult> {
  logOtpRuntime();
  const normalizedEmail = email.toLowerCase().trim();
  console.log('[otp] sendVerificationOtp started', { email: normalizedEmail });

  try {
    if (!normalizedEmail) {
      console.log('[otp] send aborted: email required');
      return { ok: false, error: 'Email is required', status: 400 };
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      console.error('[otp] send aborted: user not found', { email: normalizedEmail });
      return { ok: false, error: 'Account not found', status: 404 };
    }

    if (user.isVerified) {
      console.log('[otp] send skipped: account already verified', { email: normalizedEmail });
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
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      console.log('[otp] send blocked: resend cooldown active', {
        email: normalizedEmail,
        waitSeconds,
      });
      return {
        ok: false,
        error: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before resending`,
        status: 429,
      };
    }

    const code = generateOtpCode(6);
    console.log('[otp] OTP generated, persisting record', { email: normalizedEmail });

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        codeHash: hashOtpCode(code),
        expiresAt: getOtpExpiryDate(),
      },
    });

    console.log('[otp] calling sendOtpEmail (Resend)', { email: normalizedEmail });
    await sendOtpEmail(normalizedEmail, code);
    console.log('[otp] verification code sent', { email: normalizedEmail });
    return { ok: true, message: 'Verification code sent to your email' };
  } catch (error) {
    console.error('[otp] sendVerificationOtp failed', {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function verifyOtpCode(email: string, code: string): Promise<OtpResult> {
  logOtpRuntime();
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
