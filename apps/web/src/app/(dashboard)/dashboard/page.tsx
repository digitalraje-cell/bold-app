import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/AppShell';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { MeetingListSection } from '@/components/dashboard/MeetingCard';
import { Calendar, Radio } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [upcoming, live, past] = userId
    ? await Promise.all([
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'SCHEDULED' },
          include: { _count: { select: { participants: true } } },
          orderBy: { scheduledAt: 'asc' },
        }),
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'LIVE' },
          include: { _count: { select: { participants: true } } },
          orderBy: { startedAt: 'desc' },
        }),
        prisma.meeting.findMany({
          where: { hostId: userId, status: 'ENDED' },
          include: { _count: { select: { participants: true } } },
          orderBy: { endedAt: 'desc' },
          take: 10,
        }),
      ])
    : [[], [], []];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <VerificationBanner />
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your meetings and join calls instantly.
          </p>
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
          />
          <MeetingListSection
            title="Upcoming"
            icon="calendar"
            meetings={upcoming}
            emptyMessage="No upcoming meetings"
          />
          <MeetingListSection
            title="Past Meetings"
            icon="history"
            meetings={past}
            emptyMessage="No past meetings"
          />
        </div>
      </div>
    </AppShell>
  );
}

function JoinByCodeCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Calendar className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">Join Meeting</h3>
      <p className="mt-1 text-sm text-muted-foreground">Enter a meeting code to join</p>
    </div>
  );
}
