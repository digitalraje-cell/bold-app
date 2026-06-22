import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SidebarAuditClient } from './SidebarAuditClient';

export default function SidebarAuditPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <SidebarAuditClient />
    </Suspense>
  );
}
