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

  useEffect(() => {
    if (!pendingId) {
      setStatus('ok');
      return;
    }

    void api.billing
      .markPendingPaid(pendingId)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, [pendingId]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      {status === 'loading' ? (
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      ) : status === 'ok' ? (
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      ) : (
        <CheckCircle2 className="mx-auto h-12 w-12 text-amber-500" />
      )}

      <h1 className="mt-6 text-2xl font-bold">Payment received successfully</h1>
      {status === 'ok' ? (
        <p className="mt-3 text-muted-foreground">
          Your Pro activation request has been submitted. We will activate Pro on your account
          within 24 hours after verifying payment.
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground">
          If you completed payment, contact support with your receipt. We will activate Pro
          manually.
        </p>
      )}

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
