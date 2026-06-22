import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { MeetingListSection } from '@/components/dashboard/MeetingCard';
import { JoinByCodeCard } from '@/components/dashboard/JoinByCodeCard';
import { DashboardMessage } from '@/components/dashboard/DashboardMessage';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { Calendar, Radio } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ui, cardClass } from '@/lib/ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const meetingInclude = {
  host: { select: { name: true, email: true } },
  _count: {
    select: {
      participants: {
        where: { status: 'ADMITTED' },
      },
    },
  },
} as const;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [upcoming, liveHosted, liveJoined, past] = userId
    ? await Promise.all([
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'SCHEDULED' },
          include: meetingInclude,
          orderBy: { scheduledAt: 'asc' },
        }),
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'LIVE' },
          include: meetingInclude,
          orderBy: { startedAt: 'desc' },
        }),
        prisma.meeting.findMany({
          where: {
            status: 'LIVE',
            hostId: { not: userId },
            participants: {
              some: { userId, status: 'ADMITTED' },
            },
          },
          include: meetingInclude,
          orderBy: { startedAt: 'desc' },
        }),
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'ENDED' },
          include: meetingInclude,
          orderBy: { endedAt: 'desc' },
          take: 10,
        }),
      ])
    : [[], [], [], []];

  const liveById = new Map<string, (typeof liveHosted)[number]>();
  for (const meeting of [...liveHosted, ...liveJoined]) {
    liveById.set(meeting.id, meeting);
  }
  const live = Array.from(liveById.values()).sort((a, b) => {
    const aTime = a.startedAt?.getTime() ?? 0;
    const bTime = b.startedAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <VerificationBanner />
      <Suspense fallback={null}>
        <DashboardMessage />
      </Suspense>
      <UpgradeBanner />

      <div className="mb-10">
        <h1 className={ui.pageTitle}>
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className={ui.pageSubtitle}>Start, schedule, or join a meeting.</p>
      </div>

      <div className="mb-10 grid gap-5 sm:grid-cols-3">
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

      <div className="space-y-8">
        <MeetingListSection
          title="Live Now"
          icon="radio"
          meetings={live}
          emptyMessage="No live meetings"
          currentUserId={userId}
        />
        <MeetingListSection
          title="Upcoming"
          icon="calendar"
          meetings={upcoming}
          emptyMessage="No upcoming meetings"
          currentUserId={userId}
        />
        <MeetingListSection
          title="Past Meetings"
          icon="history"
          meetings={past}
          emptyMessage="No past meetings"
          currentUserId={userId}
        />
      </div>
    </div>
  );
}
