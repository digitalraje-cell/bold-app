import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { JoinByCodeCard } from '@/components/dashboard/JoinByCodeCard';
import { DashboardMessage } from '@/components/dashboard/DashboardMessage';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { WhatsNewCard } from '@/components/dashboard/WhatsNewCard';
import { Calendar, Radio } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ui, cardClass } from '@/lib/ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-5xl">
      <VerificationBanner />
      <Suspense fallback={null}>
        <DashboardMessage />
      </Suspense>
      <UpgradeBanner />
      <PwaInstallBanner />
      <WhatsNewCard />

      <div className="mb-10">
        <h1 className={ui.pageTitle}>
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className={ui.pageSubtitle}>Start, schedule, or join a meeting.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Link
          href="/meetings/create?type=instant"
          className={cardClass({ interactive: true, className: 'group block p-6 sm:p-7' })}
        >
          <div className={cn('mb-5', ui.iconWell)}>
            <Radio className="h-5 w-5" />
          </div>
          <h3 className="font-semibold tracking-tight">Instant Meeting</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Start a meeting right now
          </p>
        </Link>

        <Link
          href="/meetings/create?type=schedule"
          className={cardClass({ interactive: true, className: 'group block p-6 sm:p-7' })}
        >
          <div className={cn('mb-5', ui.iconWell)}>
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="font-semibold tracking-tight">Schedule Meeting</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Plan a meeting for later
          </p>
        </Link>

        <JoinByCodeCard />
      </div>
    </div>
  );
}
