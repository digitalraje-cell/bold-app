import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';
import { GuestRoomGate } from '@/components/meeting/GuestRoomGate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const session = await auth();

  const meeting = await prisma.meeting.findFirst({
    where: {
      OR: [{ id: meetingId }, { meetingCode: meetingId.toLowerCase() }],
    },
    select: {
      id: true,
      title: true,
      jitsiRoom: true,
      hostId: true,
      status: true,
    },
  });

  if (!meeting || meeting.status === 'ENDED') {
    notFound();
  }

  const isHost = session?.user?.id === meeting.hostId;

  if (session?.user) {
    return (
      <MeetingRoom
        meetingId={meeting.id}
        jitsiRoom={meeting.jitsiRoom}
        title={meeting.title}
        isHost={isHost}
        displayName={session.user.name || session.user.email || 'Guest'}
      />
    );
  }

  return (
    <GuestRoomGate
      meetingId={meeting.id}
      jitsiRoom={meeting.jitsiRoom}
      title={meeting.title}
    />
  );
}
