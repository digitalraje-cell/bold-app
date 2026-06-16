import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const session = await auth();

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
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

  if (!session?.user) {
    redirect(`/meeting/${meetingId}`);
  }

  return (
    <MeetingRoom
      meetingId={meeting.id}
      jitsiRoom={meeting.jitsiRoom}
      title={meeting.title}
      isHost={session.user.id === meeting.hostId}
    />
  );
}
