'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('pending');
  const [noted, setNoted] = useState(false);

  useEffect(() => {
    if (!pendingId) return;
    void api.billing.cancelPending(pendingId).finally(() => setNoted(true));
  }, [pendingId]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
      <h1 className="mt-6 text-2xl font-bold">Payment cancelled</h1>
      <p className="mt-3 text-muted-foreground">
        No charge was made{noted ? ' and your pending checkout was cleared' : ''}. You can try again
        whenever you are ready.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/billing/upgrade">
          <Button>Try again</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
