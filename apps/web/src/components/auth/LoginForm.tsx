'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BoldWordmark } from '@/components/brand/BoldWordmark';
import { appConfig } from '@/lib/app-config';
import { sanitizeCallbackUrl } from '@/lib/auth-routes';
import { ui } from '@/lib/ui';
import { OTP_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS } from '@/lib/otp-constants';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendOtp() {
    setError('');
    setMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        retryAfterSeconds?: number;
      };

      if (!res.ok) {
        setError(data.error || 'Could not send code. Try again.');
        if (typeof data.retryAfterSeconds === 'number' && data.retryAfterSeconds > 0) {
          setResendCooldown(data.retryAfterSeconds);
        }
        return false;
      }

      setMessage(data.message || 'Check your email for the login code.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendOtp();
    if (ok) setStep('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const result = await signIn('credentials', {
        email,
        otp,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        setError('Invalid or expired code. Request a new one and try again.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <BoldWordmark size="xl" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {step === 'email' ? `Welcome to ${appConfig.name}` : 'Enter your code'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step === 'email'
            ? 'Sign in or create an account with a one-time code sent to your email.'
            : `We sent a 6-digit code to ${email}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`}
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Button type="submit" className="w-full" size="lg" loading={sending}>
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label="One-time code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            required
            autoFocus
          />
          <Button type="submit" className="w-full" size="lg" loading={verifying}>
            Sign in
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStep('email');
              setOtp('');
              setMessage('');
              setError('');
              setResendCooldown(0);
            }}
          >
            Use a different email
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            loading={sending}
            disabled={resendCooldown > 0}
            onClick={() => void sendOtp()}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{' '}
        <Link href="/terms" className={ui.link}>
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className={ui.link}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-sm text-muted-foreground">Loading…</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
