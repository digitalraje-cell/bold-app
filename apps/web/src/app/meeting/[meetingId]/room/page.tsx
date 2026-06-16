import { normalizeMeetingCode } from '@boldmeet/shared';
import { auth } from '@/lib/auth';
import {
  fetchAuthenticatedMeetingServer,
  fetchPublicMeetingServer,
  resolveJitsiRoom,
} from '@/lib/api-server';
import { notFound, redirect } from 'next/navigation';
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

  let meeting;
  try {
    meeting = await fetchPublicMeetingServer(meetingId);
  } catch {
    notFound();
  }

  if (meeting.status === 'ENDED') {
    notFound();
  }

  if (
    normalizeMeetingCode(meetingId) !== meeting.meetingCode &&
    meetingId === meeting.id
  ) {
    redirect(`/meeting/${meeting.meetingCode}/room`);
  }

  let hostId = meeting.hostId;
  let jitsiRoom = resolveJitsiRoom(meeting);
  let title = meeting.title;

  if (session?.user && !hostId) {
    try {
      const authed = await fetchAuthenticatedMeetingServer(meetingId);
      hostId = authed.hostId;
      jitsiRoom = authed.jitsiRoom || resolveJitsiRoom(authed);
      title = authed.title;
      meeting = { ...meeting, id: authed.id, meetingCode: authed.meetingCode, hostId, jitsiRoom };
    } catch {
      // Fall back to public preview fields
    }
  }

  const isHost = Boolean(session?.user?.id && hostId && session.user.id === hostId);

  if (session?.user) {
    return (
      <MeetingRoom
        meetingId={meeting.id}
        jitsiRoom={jitsiRoom}
        title={title}
        isHost={isHost}
        displayName={session.user.name || session.user.email || 'Guest'}
      />
    );
  }

  return (
    <GuestRoomGate
      meetingId={meeting.id}
      jitsiRoom={jitsiRoom}
      title={title}
    />
  );
}
