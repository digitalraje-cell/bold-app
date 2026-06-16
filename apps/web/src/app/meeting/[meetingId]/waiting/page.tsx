'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useMeetingRouteId } from '@/hooks/useMeetingRouteId';
import { useSocket } from '@/hooks/useSocket';
import { readGuestJoinSession } from '@/lib/meeting-join';

export default function WaitingRoomPage() {
  const meetingId = useMeetingRouteId();
  const router = useRouter();
  const { on } = useSocket(meetingId || '');

  useEffect(() => {
    if (!meetingId) return;

    const guest = readGuestJoinSession(meetingId);
    if (!guest?.participantId) return;

    const unsubAdmit = on('waiting:admit', (data: unknown) => {
      const { participantId } = data as { participantId?: string };
      if (participantId === guest.participantId) {
        router.push(`/meeting/${meetingId}/room`);
      }
    });

    return () => {
      unsubAdmit?.();
    };
  }, [meetingId, on, router]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-10 w-10 animate-pulse text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">Waiting for the host</h1>
        <p className="mt-2 text-muted-foreground">
          The host will let you in shortly. Please wait...
        </p>
        {meetingId ? (
          <Link
            href={`/meeting/${meetingId}`}
            className="mt-8 inline-block text-sm text-primary hover:underline"
          >
            Back to lobby
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mt-8 inline-block text-sm text-primary hover:underline"
          >
            Back to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
