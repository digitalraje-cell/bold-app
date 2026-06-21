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
import { SubscriptionPlan } from '@boldmeet/shared';

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current plan:{' '}
            {(session?.user?.subscriptionPlan as SubscriptionPlan) === SubscriptionPlan.PRO
              ? 'Pro'
              : 'Free'}
          </p>
          <h1 className="text-2xl font-bold">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your meetings and join calls instantly.
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/meetings/create?type=instant"
            className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary">Instant Meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start a meeting right now</p>
          </Link>

          <Link
            href="/meetings/create?type=schedule"
            className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary">Schedule Meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">Plan a meeting for later</p>
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
