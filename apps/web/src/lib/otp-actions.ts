'use server';

import { auth } from '@/lib/auth';
import { sendVerificationOtp, verifyOtpCode } from '@/lib/otp-service';

export async function sendVerificationCodeAction(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.email) {
    console.error('[otp-action] send rejected: missing session email');
    return { ok: false, error: 'You must be signed in to request a verification code' };
  }

  console.log('[otp-action] send requested', { email: session.user.email });

  try {
    const result = await sendVerificationOtp(session.user.email);
    console.log('[otp-action] send completed', {
      email: session.user.email,
      ok: result.ok,
      message: result.ok ? result.message : undefined,
      error: result.ok ? undefined : result.error,
      status: result.ok ? undefined : result.status,
    });
    return result.ok
      ? { ok: true, message: result.message }
      : { ok: false, error: result.error };
  } catch (error) {
    console.error('[otp-action] send unexpected error', {
      email: session.user.email,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { ok: false, error: 'Failed to send verification email. Please try again.' };
  }
}

export async function verifyAccountCodeAction(code: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.email) {
    console.error('[otp-action] verify rejected: missing session email');
    return { ok: false, error: 'You must be signed in to verify your account' };
  }

  console.log('[otp-action] verify requested', { email: session.user.email });
  const result = await verifyOtpCode(session.user.email, code);
  return result.ok
    ? { ok: true, message: result.message }
    : { ok: false, error: result.error };
}
