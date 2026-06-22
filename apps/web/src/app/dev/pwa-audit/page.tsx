import { notFound } from 'next/navigation';
import { MeetingJoinGate } from '@/components/pwa/MeetingJoinGate';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

/** Dev-only page for pre-merge PWA screenshot audit. Returns 404 in production. */
export default function PwaAuditPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const mockStats = {
    totalUsers: 1284,
    pwaInstalledUsers: 312,
    installationPercentage: 24.3,
  };

  return (
    <div className="min-h-dvh bg-background px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-20">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dev audit only — not in production
          </p>
          <h1 className="mt-2 text-2xl font-semibold">PWA install flow preview</h1>
        </header>

        <section id="dashboard-banner">
          <h2 className="mb-4 text-lg font-semibold">Dashboard install banner</h2>
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-6">
            <PwaInstallBanner />
          </div>
        </section>

        <section id="admin-analytics">
          <h2 className="mb-4 text-lg font-semibold">Admin PWA analytics</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { label: 'Total users', value: mockStats.totalUsers },
              { label: 'PWA installed users', value: mockStats.pwaInstalledUsers },
              { label: 'Installation rate', value: `${mockStats.installationPercentage}%` },
            ].map((stat) => (
              <div key={stat.label} className={cn(cardClass({ bordered: true }), 'p-6')}>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="chrome-install">
          <h2 className="mb-4 text-lg font-semibold">Chrome install flow (UI)</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Native browser install prompt is OS-controlled; this shows the in-app install UI.
          </p>
          <MeetingJoinGate
            meetingId="DEMO123"
            initialPreview={{
              id: 'demo',
              title: 'Weekly Team Standup',
              meetingCode: 'DEMO123',
              hostName: 'Ayush Prajapati',
              status: 'LIVE',
              hasPassword: false,
            }}
            initialPreviewError={null}
          />
        </section>

        <section id="mobile-install">
          <h2 className="mb-4 text-lg font-semibold">Mobile install flow (UI)</h2>
          <div className="mx-auto max-w-sm">
            <MeetingJoinGate
              meetingId="DEMO123"
              initialPreview={{
                id: 'demo',
                title: 'Client Coaching Session',
                meetingCode: 'DEMO123',
                hostName: 'Dr. Sambhav Kumar',
                status: 'SCHEDULED',
                hasPassword: false,
              }}
              initialPreviewError={null}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
