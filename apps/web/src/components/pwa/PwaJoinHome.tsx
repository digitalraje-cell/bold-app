'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Radio, Video } from 'lucide-react';
import { DEFAULT_MEETING_SETTINGS, formatMeetingCode } from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath } from '@/lib/meeting-join';
import { parseMeetingLinkOrCode } from '@/lib/parse-meeting-link';
import {
  addRecentMeeting,
  formatJoinedAgo,
  readRecentMeetings,
  type RecentMeeting,
} from '@/lib/recent-meetings';

export function PwaJoinHome() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const startingRef = useRef(false);

  useEffect(() => {
    setRecent(readRecentMeetings());
  }, []);

  const navigateToMeeting = useCallback(
    async (code: string) => {
      setError(null);
      setJoining(true);
      try {
        const preview = (await api.meetings.getPublic(code)) as {
          title?: string;
          meetingCode?: string;
          id?: string;
        } | null;
        if (!preview) {
          setError('Meeting not found. Check your code or link and try again.');
          return;
        }
        const routeId = preview.meetingCode ?? preview.id ?? code;
        addRecentMeeting({
          meetingCode: routeId,
          meetingName: preview.title ?? null,
        });
        setRecent(readRecentMeetings());
        router.push(`/join/${routeId}`);
      } catch {
        setError('Meeting not found or no longer available.');
      } finally {
        setJoining(false);
      }
    },
    [router],
  );

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const code = parseMeetingLinkOrCode(joinInput);
    if (!code) {
      setError('Enter a valid meeting code or link.');
      return;
    }
    await navigateToMeeting(code);
  }

  async function handleStartMeeting() {
    if (sessionStatus === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/home');
      return;
    }

    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setStarting(true);

    try {
      const displayName =
        session.user.name || session.user.email?.split('@')[0] || 'Host';
      const meeting = (await api.meetings.create({
        title: `${displayName}'s meeting`,
        durationMinutes: 60,
        settings: DEFAULT_MEETING_SETTINGS,
      })) as { id: string; meetingCode: string };

      const path = await joinMeetingAndGetPath(meeting.meetingCode, displayName, {
        viaDirectLink: true,
      });
      router.push(path);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start a meeting. Try again.',
      );
      startingRef.current = false;
      setStarting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border/80 bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link href="/home" className="text-lg font-semibold tracking-tight text-foreground">
            Bold
          </Link>
          {session?.user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 text-center sm:text-left">
          <div className={cn(ui.eyebrow, 'mb-4 inline-flex')}>
            <Video className="h-3.5 w-3.5" />
            Bold meetings
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Join or start a meeting
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Paste a meeting code, link, or any message that contains one.
          </p>
        </div>

        {error ? <Alert className="mb-5">{error}</Alert> : null}

        <form onSubmit={(e) => void handleJoin(e)} className={cardClass({ className: 'p-5 sm:p-6' })}>
          <label htmlFor="join-input" className="font-semibold text-foreground">
            Join Meeting
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            Meeting code, full URL, or text like &ldquo;Meeting ID: 9041788223&rdquo;
          </p>
          <div className="mt-4 space-y-3">
            <Input
              id="join-input"
              value={joinInput}
              onChange={(event) => setJoinInput(event.target.value)}
              placeholder="9041788223 or https://bold.robozant.com/join/…"
              autoComplete="off"
              aria-label="Meeting code or link"
            />
            <Button type="submit" className="w-full" loading={joining}>
              Join Meeting
            </Button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className={cardClass({ className: 'p-5 sm:p-6' })}>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Radio className="h-4 w-4" />
            Start New Meeting
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {session?.user
              ? 'Create an instant meeting and jump right in.'
              : 'Sign in to host a new meeting.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            loading={starting}
            onClick={() => void handleStartMeeting()}
          >
            Start New Meeting
          </Button>
        </div>

        {recent.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent meetings
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.map((item) => (
                <li key={item.meetingCode}>
                  <button
                    type="button"
                    onClick={() => void navigateToMeeting(item.meetingCode)}
                    className={cn(
                      cardClass({ interactive: true }),
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {item.meetingName?.trim() || 'Meeting'}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {formatMeetingCode(item.meetingCode)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground/80">
                        {formatJoinedAgo(item.joinedAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-foreground">Join</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
