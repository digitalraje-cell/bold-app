'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('pending');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingId) {
      setStatus('ok');
      setMessage('If you completed payment, our team will activate Pro within 24 hours.');
      return;
    }

    void api.billing
      .markPendingPaid(pendingId)
      .then((result) => {
        setStatus('ok');
        setMessage(
          (result as { message?: string }).message ||
            'Payment received. Pro will be activated after verification.',
        );
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not confirm payment status. Contact support if you were charged.');
      });
  }, [pendingId]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      {status === 'loading' ? (
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      ) : (
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      )}

      <h1 className="mt-6 text-2xl font-bold">Payment successful</h1>
      <p className="mt-3 text-muted-foreground">
        {message || 'Thank you for upgrading to BoldMeet Pro.'}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        <Link href="/billing">
          <Button variant="secondary">View billing</Button>
        </Link>
      </div>
    </div>
  );
}
