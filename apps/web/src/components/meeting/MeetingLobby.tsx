'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Radio, Users } from 'lucide-react';
import { formatMeetingCode } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath } from '@/lib/meeting-join';
import { useMeetingRouteId } from '@/hooks/useMeetingRouteId';
import { cn } from '@/lib/utils';

export type PublicMeetingPreview = {
  id: string;
  title: string;
  meetingCode: string;
  hostId?: string;
  jitsiRoom?: string;
  hostName: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startedAt?: string | null;
  scheduledAt?: string | null;
  endedAt?: string | null;
  participantCount?: number;
  hasPassword: boolean;
};

const statusBadge = {
  LIVE: {
    label: 'Live',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ENDED: {
    label: 'Ended',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
} as const;

function normalizePreviewError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('not found') || lower.includes('no longer available')) {
    return 'Meeting not found or no longer available';
  }
  return message;
}

function formatMeetingTime(meeting: PublicMeetingPreview): string | null {
  if (meeting.status === 'LIVE') {
    return meeting.startedAt ? new Date(meeting.startedAt).toLocaleString() : null;
  }
  if (meeting.status === 'SCHEDULED' && meeting.scheduledAt) {
    return new Date(meeting.scheduledAt).toLocaleString();
  }
  if (meeting.status === 'ENDED' && meeting.endedAt) {
    return new Date(meeting.endedAt).toLocaleString();
  }
  if (meeting.startedAt) {
    return new Date(meeting.startedAt).toLocaleString();
  }
  if (meeting.scheduledAt) {
    return new Date(meeting.scheduledAt).toLocaleString();
  }
  return null;
}

function statusSubtitle(meeting: PublicMeetingPreview): string {
  const count = meeting.participantCount ?? 0;
  const participants =
    count === 1 ? '1 participant' : `${count} participants`;

  if (meeting.status === 'LIVE') {
    return `Live now · ${participants}`;
  }
  if (meeting.status === 'SCHEDULED') {
    const when = meeting.scheduledAt
      ? `Starts ${new Date(meeting.scheduledAt).toLocaleString()}`
      : 'Scheduled';
    return `${when} · ${participants}`;
  }
  return `Ended · ${participants}`;
}

export function MeetingLobby({
  meetingId: meetingIdProp,
  initialPreview = null,
  initialPreviewError = null,
}: {
  meetingId?: string | null;
  initialPreview?: PublicMeetingPreview | null;
  initialPreviewError?: string | null;
}) {
  const routeMeetingId = useMeetingRouteId();
  const meetingId = meetingIdProp ?? routeMeetingId;
  const { data: session } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const hasServerPreview = initialPreview !== null || Boolean(initialPreviewError);
  const [previewLoading, setPreviewLoading] = useState(!hasServerPreview);
  const [previewError, setPreviewError] = useState(initialPreviewError || '');
  const [joinError, setJoinError] = useState('');
  const [meeting, setMeeting] = useState<PublicMeetingPreview | null>(initialPreview);

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (!meetingId || hasServerPreview) {
      if (!meetingId) {
        setPreviewLoading(false);
      }
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError('');

    api.meetings
      .getPublic(meetingId)
      .then((data) => {
        if (!cancelled) {
          console.log('[meeting-lobby] public preview loaded', {
            meetingId,
            title: (data as PublicMeetingPreview).title,
            status: (data as PublicMeetingPreview).status,
          });
          setMeeting(data as PublicMeetingPreview);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Meeting not found or no longer available';
          console.error('[meeting-lobby] public preview failed', { meetingId, error: message });
          setMeeting(null);
          setPreviewError(normalizePreviewError(message));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, hasServerPreview]);

  const canJoin =
    Boolean(meeting) &&
    meeting?.status !== 'ENDED' &&
    !previewError &&
    !previewLoading;

  async function handleJoin() {
    if (!meetingId) {
      setJoinError('Invalid meeting link');
      return;
    }

    if (!canJoin) {
      return;
    }

    if (!displayName.trim()) {
      setJoinError('Please enter your name');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    try {
      console.log('[meeting-lobby] join clicked', { meetingId, displayName: displayName.trim() });
      const path = await joinMeetingAndGetPath(
        meetingId,
        displayName.trim(),
        password || undefined,
      );
      router.push(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join meeting';
      console.error('[meeting-lobby] join failed', { meetingId, error: message });
      setJoinError(message);
      setJoinLoading(false);
    }
  }

  if (!meetingId) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Invalid meeting link. Check the URL or return to your dashboard.
        </div>
        <Link href="/dashboard" className="mt-4 text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const badge = meeting ? statusBadge[meeting.status] : null;
  const timeLabel =
    meeting?.status === 'SCHEDULED'
      ? 'Scheduled for'
      : meeting?.status === 'ENDED'
        ? 'Ended at'
        : 'Started';

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {previewLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-7 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ) : meeting ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-semibold leading-tight">{meeting.title}</h1>
                {badge && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Hosted by <span className="font-medium text-foreground">{meeting.hostName}</span>
              </p>

              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {meeting.status === 'LIVE' ? (
                  <Radio className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
                {statusSubtitle(meeting)}
              </p>

              {formatMeetingTime(meeting) && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {timeLabel} {formatMeetingTime(meeting)}
                </p>
              )}

              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Meeting ID
                </p>
                <p className="mt-1 font-mono text-sm">{formatMeetingCode(meeting.meetingCode)}</p>
              </div>

              {meeting.status === 'ENDED' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  This meeting has ended
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-semibold">Meeting unavailable</h1>
              <p className="text-sm text-muted-foreground">
                {previewError || 'Meeting not found or no longer available'}
              </p>
            </div>
          )}
        </div>

        {canJoin && joinError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {joinError}
          </div>
        )}

        {canJoin && (
          <>
            <Input
              label="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              autoFocus
            />

            {meeting?.hasPassword && (
              <Input
                label="Meeting password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Required"
              />
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleJoin}
              loading={joinLoading}
              disabled={previewLoading}
            >
              Join Meeting
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
