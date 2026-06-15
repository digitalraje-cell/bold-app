'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { appConfig } from '@/lib/app-config';
import {
  sendVerificationCodeAction,
  verifyAccountCodeAction,
} from '@/lib/otp-actions';

export function VerifyAccountForm() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const autoSendAttempted = useRef(false);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = useCallback(async () => {
    if (status !== 'authenticated') {
      setError('Session is still loading. Please wait a moment and try again.');
      return;
    }

    setSending(true);
    setError('');
    setMessage('');

    try {
      console.log('[verify-ui] requesting verification code');
      const result = await sendVerificationCodeAction();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send code');
      }

      setMessage(result.message || 'Verification code sent to your email');
    } catch (err) {
      console.error('[verify-ui] send failed', err);
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setSending(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && !autoSendAttempted.current) {
      autoSendAttempted.current = true;
      void handleSend();
    }
  }, [status, handleSend]);

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();

    if (status !== 'authenticated') {
      setError('Session is still loading. Please wait and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[verify-ui] submitting verification code');
      const result = await verifyAccountCodeAction(code);

      if (!result.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      await update({ isVerified: true });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('[verify-ui] verify failed', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Verify your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verify your email to host meetings on {appConfig.name}
        </p>
        {session?.user?.email && (
          <p className="mt-1 text-xs text-muted-foreground">
            Code will be sent to {session.user.email}
          </p>
        )}
      </div>

      {status === 'loading' && (
        <p className="text-center text-sm text-muted-foreground">Loading session…</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <form onSubmit={verifyOtp} className="space-y-4">
        <Input
          label="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6-digit code"
          inputMode="numeric"
          required
        />
        <Button type="submit" className="w-full" loading={loading} disabled={status !== 'authenticated'}>
          Verify account
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          loading={sending}
          disabled={status !== 'authenticated'}
        >
          {message ? 'Resend code' : 'Send verification code'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
