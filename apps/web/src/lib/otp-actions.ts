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
  const result = await sendVerificationOtp(session.user.email);
  return result.ok
    ? { ok: true, message: result.message }
    : { ok: false, error: result.error };
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
