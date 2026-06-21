import { Suspense } from 'react';
import PaymentCancelledContent from './PaymentCancelledContent';

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-muted-foreground">Loading…</p>}>
      <PaymentCancelledContent />
    </Suspense>
  );
}
