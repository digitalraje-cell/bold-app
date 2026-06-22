import {
  defaultSubscriptionCreateData,
  resolveUserRoleForEmail,
} from '@boldmeet/shared';
import { prisma } from './prisma';
import { logUserActivity, touchUserLogin } from './activity-log';
import { generateOtpCode, hashOtpCode } from './crypto';
import { getOtpExpiryDate, sendOtpEmail } from './email';
import { RESEND_COOLDOWN_SECONDS } from './otp-constants';

export { OTP_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS } from './otp-constants';
const MAX_ATTEMPTS = 5;

function logOtpRuntime(): void {
  if (process.env.NEXT_RUNTIME !== 'edge') {
    console.log('[otp] runtime = nodejs');
  }
}

export type OtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status?: number; retryAfterSeconds?: number };

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string | null;
  isVerified: boolean;
  subscriptionPlan: string;
  role: string;
  signupProfileComplete: boolean;
  isNewUser: boolean;
};

async function ensureSuperAdminRole(userId: string, email: string) {
  const role = resolveUserRoleForEmail(email);
  if (role === 'SUPER_ADMIN') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SUPER_ADMIN' },
    });
  }
  return role;
}

async function checkResendCooldown(normalizedEmail: string): Promise<OtpResult | null> {
  const recent = await prisma.otpVerification.findFirst({
    where: { email: normalizedEmail, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    const elapsedSeconds = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000);
    const retryAfterSeconds = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
    return {
      ok: false,
      error: `Please wait ${retryAfterSeconds} seconds before resending`,
      status: 429,
      retryAfterSeconds,
    };
  }

  return null;
}

/** Send a login/signup OTP — works for new and returning users. */
export async function sendAuthOtp(email: string): Promise<OtpResult> {
  logOtpRuntime();
  const normalizedEmail = email.toLowerCase().trim();
  console.log('[otp] sendAuthOtp started', { email: normalizedEmail });

  if (!normalizedEmail) {
    return { ok: false, error: 'Email is required', status: 400 };
  }

  const cooldown = await checkResendCooldown(normalizedEmail);
  if (cooldown) return cooldown;

  const code = generateOtpCode(6);

  await prisma.otpVerification.create({
    data: {
      email: normalizedEmail,
      codeHash: hashOtpCode(code),
      expiresAt: getOtpExpiryDate(),
    },
  });

  await sendOtpEmail(normalizedEmail, code);
  console.log('[otp] login code sent', { email: normalizedEmail });
  return { ok: true, message: 'Login code sent to your email' };
}

/** @deprecated use sendAuthOtp */
export async function sendVerificationOtp(email: string): Promise<OtpResult> {
  return sendAuthOtp(email);
}

async function validateAndConsumeOtp(
  normalizedEmail: string,
  normalizedCode: string,
): Promise<OtpResult> {
  if (!normalizedEmail || !normalizedCode) {
    return { ok: false, error: 'Email and code are required', status: 400 };
  }

  const otp = await prisma.otpVerification.findFirst({
    where: { email: normalizedEmail, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { ok: false, error: 'No active code found. Request a new one.', status: 404 };
  }

  if (otp.expiresAt < new Date()) {
    return { ok: false, error: 'Code expired. Request a new one.', status: 400 };
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
    return { ok: false, error: 'Invalid code', status: 400 };
  }

  await prisma.otpVerification.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return { ok: true, message: 'Code accepted' };
}

function isSignupComplete(user: {
  name: string | null;
  profile: {
    mobile: string | null;
    country: string | null;
    organization: string | null;
    designation: string | null;
  } | null;
}) {
  return Boolean(
    user.name?.trim() &&
      user.profile?.mobile?.trim() &&
      user.profile?.country?.trim() &&
      user.profile?.organization?.trim() &&
      user.profile?.designation?.trim(),
  );
}

/** Verify OTP and sign in — creates account automatically if new. */
export async function verifyAuthOtp(
  email: string,
  code: string,
): Promise<
  | { ok: true; user: AuthUserRecord }
  | { ok: false; error: string; status?: number }
> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = String(code || '').trim();

  const validation = await validateAndConsumeOtp(normalizedEmail, normalizedCode);
  if (!validation.ok) {
    return validation;
  }

  const now = new Date();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });

  if (existing && !existing.isActive) {
    return { ok: false, error: 'Your account has been deactivated', status: 403 };
  }

  const role = resolveUserRoleForEmail(normalizedEmail) as 'USER' | 'SUPER_ADMIN';
  const user = existing
    ? await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          isVerified: true,
          verifiedAt: existing.verifiedAt ?? now,
          emailVerified: now,
          role,
          lastLoginAt: now,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isVerified: true,
          subscriptionPlan: true,
          role: true,
          profile: {
            select: {
              mobile: true,
              country: true,
              organization: true,
              designation: true,
            },
          },
        },
      })
    : await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          role,
          isVerified: true,
          verifiedAt: now,
          emailVerified: now,
          lastLoginAt: now,
          profile: { create: {} },
          subscription: { create: defaultSubscriptionCreateData() },
        },
        select: {
          id: true,
          email: true,
          name: true,
          isVerified: true,
          subscriptionPlan: true,
          role: true,
          profile: {
            select: {
              mobile: true,
              country: true,
              organization: true,
              designation: true,
            },
          },
        },
      });

  await ensureSuperAdminRole(user.id, normalizedEmail);
  await touchUserLogin(user.id);
  await logUserActivity(user.id, 'LOGIN', { email: normalizedEmail });

  console.log('[otp] auth success', { email: normalizedEmail, created: !existing });
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
      signupProfileComplete: isSignupComplete(user),
      isNewUser: !existing,
    },
  };
}

/** Verify OTP for an already-signed-in user (legacy account verification flow). */
export async function verifyOtpCode(email: string, code: string): Promise<OtpResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = String(code || '').trim();

  const validation = await validateAndConsumeOtp(normalizedEmail, normalizedCode);
  if (!validation.ok) {
    return validation;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { ok: false, error: 'Account not found', status: 404 };
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      isVerified: true,
      verifiedAt: user.verifiedAt ?? new Date(),
      emailVerified: new Date(),
    },
  });

  console.log('[otp] account verified', { email: normalizedEmail });
  return { ok: true, message: 'Account verified successfully' };
}
