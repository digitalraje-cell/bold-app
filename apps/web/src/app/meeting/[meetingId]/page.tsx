'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath } from '@/lib/meeting-join';
import { useMeetingRouteId } from '@/hooks/useMeetingRouteId';

type PublicMeeting = {
  id: string;
  title: string;
  meetingCode: string;
  hostName: string;
  hasPassword: boolean;
};

export default function MeetingLobbyPage() {
  const meetingId = useMeetingRouteId();
  const { data: session } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [error, setError] = useState('');
  const [meeting, setMeeting] = useState<PublicMeeting | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (!meetingId) {
      setLoadingMeeting(false);
      return;
    }

    let cancelled = false;
    setLoadingMeeting(true);
    setError('');

    api.meetings
      .getPublic(meetingId)
      .then((data) => {
        if (!cancelled) {
          console.log('[meeting-lobby] public preview loaded', {
            meetingId,
            title: (data as PublicMeeting).title,
          });
          setMeeting(data as PublicMeeting);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[meeting-lobby] public preview failed', {
            meetingId,
            error: err instanceof Error ? err.message : err,
          });
          setMeeting(null);
          setError(err instanceof Error ? err.message : 'Meeting not found');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMeeting(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  async function handleJoin() {
    if (!meetingId) {
      setError('Invalid meeting link');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[meeting-lobby] join clicked', { meetingId, displayName: displayName.trim() });
      const path = await joinMeetingAndGetPath(
        meetingId,
        displayName.trim(),
        password || undefined,
      );
      router.push(path);
    } catch (err) {
      console.error('[meeting-lobby] join failed', {
        meetingId,
        error: err instanceof Error ? err.message : err,
      });
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
      setLoading(false);
    }
  }

  if (!meetingId) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Invalid meeting link. Check the URL or return to your dashboard.
        </div>
        <Link href="/dashboard" className="mt-4 text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <h1 className="text-2xl font-semibold">
            {loadingMeeting ? 'Loading meeting…' : meeting?.title || 'Join meeting'}
          </h1>
          {meeting && (
            <p className="mt-1 text-sm text-muted-foreground">
              Hosted by {meeting.hostName} · ID {meeting.meetingCode}
            </p>
          )}
          {!loadingMeeting && !meeting && (
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your name to join
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          autoFocus
        />

        <Input
          label="Meeting password (if required)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={meeting?.hasPassword ? 'Required' : 'Optional'}
        />

        <Button
          className="w-full"
          size="lg"
          onClick={handleJoin}
          loading={loading}
          disabled={loadingMeeting || (!meeting && !error)}
        >
          Join Meeting
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
