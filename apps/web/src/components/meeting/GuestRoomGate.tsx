'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';
import { readGuestJoinSession } from '@/lib/meeting-join';

interface GuestRoomGateProps {
  meetingId: string;
  jitsiRoom: string;
  title: string;
}

export function GuestRoomGate({ meetingId, jitsiRoom, title }: GuestRoomGateProps) {
  const [guest, setGuest] = useState<ReturnType<typeof readGuestJoinSession>>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setGuest(readGuestJoinSession(meetingId));
    setChecked(true);
  }, [meetingId]);

  if (!checked) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted-foreground">
        Loading meeting room…
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Join required</h1>
          <p className="text-sm text-muted-foreground">
            Enter your name in the lobby before joining the meeting room.
          </p>
          <Link
            href={`/meeting/${meetingId}`}
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MeetingRoom
      meetingId={meetingId}
      jitsiRoom={jitsiRoom}
      title={title}
      isHost={false}
      displayName={guest.displayName}
    />
  );
}
