import { prisma } from '@/lib/prisma';

const meetingInclude = {
  host: { select: { name: true, email: true } },
  _count: {
    select: {
      participants: {
        where: { status: 'ADMITTED' as const },
      },
    },
  },
} as const;

export async function loadUserMeetings(userId: string | undefined) {
  if (!userId) {
    return { live: [], upcoming: [], past: [] };
  }

  const [upcoming, liveHosted, liveJoined, past] = await Promise.all([
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
  ]);

  const liveById = new Map<string, (typeof liveHosted)[number]>();
  for (const meeting of [...liveHosted, ...liveJoined]) {
    liveById.set(meeting.id, meeting);
  }
  const live = Array.from(liveById.values()).sort((a, b) => {
    const aTime = a.startedAt?.getTime() ?? 0;
    const bTime = b.startedAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return { live, upcoming, past };
}
