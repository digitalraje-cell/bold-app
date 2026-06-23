import { notFound } from 'next/navigation';
import { AttendeeDockWireframes } from '@/components/meeting/attendee-dock/AttendeeDockWireframes';

/** Dev-only Attendee Dock V1 wireframes — not served in production. */
export default function AttendeeDockWireframesPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dev preview — Attendee Dock V1
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Layout wireframes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Approved V1 modes: right, top, and hidden dock; speaker and grid stage; floating self
            view; webinar and screen-share effective layouts. Preferences persist via{' '}
            <code className="text-xs">bold:attendee-layout-prefs</code>.
          </p>
        </header>
        <AttendeeDockWireframes />
      </div>
    </div>
  );
}
