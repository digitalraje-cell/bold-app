'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Radio, Users } from 'lucide-react';
import { formatMeetingCode } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath, readGuestJoinSession } from '@/lib/meeting-join';
import { saveJoinMediaPrefs } from '@/lib/join-media-prefs';
import { readUserSettings } from '@/lib/user-settings';
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
  registrationRequired?: boolean;
  scheduledEndAt?: string | null;
  durationMinutes?: number | null;
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
  if (lower.includes('passcode') || lower.includes('password')) {
    if (lower.includes('invalid')) return 'Invalid meeting passcode';
    if (lower.includes('required')) return 'Meeting passcode required';
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
  const searchParams = useSearchParams();
  const entryViaCode = searchParams.get('entry') === 'code';
  const [displayName, setDisplayName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [registrantEmail, setRegistrantEmail] = useState(session?.user?.email ?? '');
  const [registrationDone, setRegistrationDone] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
  });
  const [joinLoading, setJoinLoading] = useState(false);
  const hasServerPreview = initialPreview !== null || Boolean(initialPreviewError);
  const [previewLoading, setPreviewLoading] = useState(!hasServerPreview);
  const [previewError, setPreviewError] = useState(initialPreviewError || '');
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinWithMic, setJoinWithMic] = useState(true);
  const [joinWithCamera, setJoinWithCamera] = useState(true);
  const [meeting, setMeeting] = useState<PublicMeetingPreview | null>(initialPreview);
  const [priorGuest, setPriorGuest] = useState(false);

  useEffect(() => {
    const prefs = readUserSettings().meeting;
    setJoinWithMic(prefs.joinWithMic);
    setJoinWithCamera(prefs.joinWithCamera);
  }, []);

  useEffect(() => {
    if (meetingId) {
      setPriorGuest(Boolean(readGuestJoinSession(meetingId)));
    }
  }, [meetingId]);

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (session?.user?.email) {
      setRegistrantEmail(session.user.email);
      setRegForm((prev) => ({ ...prev, email: session.user?.email ?? prev.email }));
    }
  }, [session?.user?.email]);

  const showPasscodeField =
    Boolean(meeting?.hasPassword) && entryViaCode && !session?.user?.id;

  const needsRegistration =
    Boolean(meeting?.registrationRequired) &&
    !registrationDone &&
    !session?.user?.id;

  const endTimePreview = useMemo(() => {
    if (meeting?.scheduledEndAt) {
      return new Date(meeting.scheduledEndAt).toLocaleString();
    }
    if (meeting?.scheduledAt && meeting.durationMinutes) {
      return new Date(
        new Date(meeting.scheduledAt).getTime() + meeting.durationMinutes * 60_000,
      ).toLocaleString();
    }
    return null;
  }, [meeting?.scheduledAt, meeting?.scheduledEndAt, meeting?.durationMinutes]);

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingId) return;
    setRegisterLoading(true);
    setJoinError('');
    try {
      await api.meetings.register(meetingId, {
        fullName: regForm.fullName.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim() || undefined,
        company: regForm.company.trim() || undefined,
        designation: regForm.designation.trim() || undefined,
      });
      setRegistrantEmail(regForm.email.trim());
      setRegistrationDone(true);
      setDisplayName(regForm.fullName.trim());
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  }

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
      saveJoinMediaPrefs({
        startWithAudio: joinWithMic,
        startWithVideo: joinWithCamera,
      });
      const path = await joinMeetingAndGetPath(meetingId, displayName.trim(), {
        password: showPasscodeField ? passcode || undefined : undefined,
        viaDirectLink: !entryViaCode,
        participantId: meetingId ? readGuestJoinSession(meetingId)?.participantId : undefined,
        registrantEmail: meeting?.registrationRequired
          ? registrantEmail || session?.user?.email || undefined
          : undefined,
      });
      setJoined(true);
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

              {endTimePreview && meeting.status !== 'ENDED' && (
                <p className="text-sm text-muted-foreground">
                  Ends {endTimePreview}
                  {meeting.durationMinutes ? ` · ${meeting.durationMinutes} min` : ''}
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

        {canJoin && needsRegistration && !joined && (
          <form onSubmit={handleRegister} className="space-y-3 rounded-xl border border-border p-4">
            <h2 className="font-semibold">Registration required</h2>
            <Input
              label="Full name"
              value={regForm.fullName}
              onChange={(e) => setRegForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <Input
              label="Phone (optional)"
              value={regForm.phone}
              onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Company (optional)"
              value={regForm.company}
              onChange={(e) => setRegForm((p) => ({ ...p, company: e.target.value }))}
            />
            <Input
              label="Designation (optional)"
              value={regForm.designation}
              onChange={(e) => setRegForm((p) => ({ ...p, designation: e.target.value }))}
            />
            <Button type="submit" className="w-full" loading={registerLoading}>
              Register to join
            </Button>
          </form>
        )}

        {canJoin && !needsRegistration && !joined && (
          <>
            <Input
              label="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              autoFocus
            />

            {showPasscodeField && (
              <Input
                label="Meeting passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Required to join"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJoinWithMic((v) => !v)}
                className={cn(
                  'rounded-xl border px-3 py-3 text-sm font-medium transition',
                  joinWithMic
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground',
                )}
              >
                {joinWithMic ? 'Mic on' : 'Mic off'}
              </button>
              <button
                type="button"
                onClick={() => setJoinWithCamera((v) => !v)}
                className={cn(
                  'rounded-xl border px-3 py-3 text-sm font-medium transition',
                  joinWithCamera
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground',
                )}
              >
                {joinWithCamera ? 'Camera on' : 'Camera off'}
              </button>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleJoin}
              loading={joinLoading}
              disabled={previewLoading || joinLoading}
            >
              {priorGuest ? 'Join Meeting Again' : 'Join Meeting'}
            </Button>
          </>
        )}

        {canJoin && joined && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Joining meeting…
          </div>
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
