'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, ChevronUp, History, Radio, Users, type LucideIcon } from 'lucide-react';
import { formatMeetingCode } from '@boldmeet/shared';
import { BoldIconMark } from '@/components/brand/BoldIconMark';
import { BRAND } from '@/lib/brand';
import { getMeetingInviteUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { CopyButton } from './CopyButton';

export type MeetingSectionIcon = 'radio' | 'calendar' | 'history';

const sectionIcons: Record<MeetingSectionIcon, LucideIcon> = {
  radio: Radio,
  calendar: Calendar,
  history: History,
};

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId?: string;
    scheduledAt?: string | Date | null;
    startedAt?: string | Date | null;
    endedAt?: string | Date | null;
    host?: { name: string | null; email: string | null };
    _count?: { participants: number };
  };
  currentUserId?: string;
}

const statusConfig = {
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  LIVE: { label: 'Live', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  ENDED: { label: 'Ended', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function hostLabel(host?: MeetingCardProps['meeting']['host']): string {
  if (!host) return 'Unknown host';
  return host.name || host.email || 'Unknown host';
}

export function MeetingCard({ meeting, currentUserId }: MeetingCardProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const status = statusConfig[meeting.status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
  const date = meeting.scheduledAt || meeting.startedAt || meeting.endedAt;
  const inviteLink = getMeetingInviteUrl(meeting.meetingCode);
  const meetingIdLabel = formatMeetingCode(meeting.meetingCode);
  const isJoinable = meeting.status === 'LIVE' || meeting.status === 'SCHEDULED';
  const isLive = meeting.status === 'LIVE';
  const isHost = Boolean(currentUserId && meeting.hostId === currentUserId);

  const handleEndMeeting = async () => {
    if (!window.confirm('End this meeting for everyone?')) return;
    setActionLoading(true);
    try {
      await api.meetings.end(meeting.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to end meeting');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveMeeting = async () => {
    setActionLoading(true);
    try {
      await api.meetings.leave(meeting.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to leave meeting');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{meeting.title}</h3>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{meetingIdLabel}</p>
          {date && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(date).toLocaleString()}
            </p>
          )}
          {meeting._count && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {meeting._count.participants} participant{meeting._count.participants !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {isJoinable ? (
            <>
              {isLive && isHost && (
                <>
                  <Link
                    href={`/meeting/${meeting.meetingCode}`}
                    className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Join
                  </Link>
                  <button
                    type="button"
                    onClick={handleEndMeeting}
                    disabled={actionLoading}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    End Meeting
                  </button>
                  <CopyButton text={inviteLink} label="Copy Invite Link" className="w-full" />
                </>
              )}
              {isLive && !isHost && (
                <button
                  type="button"
                  onClick={handleLeaveMeeting}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Leave Meeting
                </button>
              )}
              {!isLive && (
                <Link
                  href={`/meeting/${meeting.meetingCode}`}
                  className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Start
                </Link>
              )}
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Details
                {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </>
          ) : (
            <Link
              href={`/meetings/${meeting.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Details
            </Link>
          )}
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting ID</p>
            <p className="mt-1 font-mono text-sm">{meetingIdLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Host</p>
            <p className="mt-1 text-sm">{hostLabel(meeting.host)}</p>
          </div>
          {meeting.startedAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Started</p>
              <p className="mt-1 text-sm">{new Date(meeting.startedAt).toLocaleString()}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <CopyButton text={meetingIdLabel} label="Copy Meeting ID" />
            <CopyButton text={inviteLink} label="Copy Invite Link" />
            {isHost && (
              <Link
                href={`/meetings/${meeting.id}/registrations`}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Registrations
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MeetingListEmpty({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <BoldIconMark size={48} className="mx-auto opacity-80" />
      <p className="mt-4 font-medium text-foreground">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">{BRAND.tagline}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function MeetingListSection({
  title,
  icon,
  meetings,
  emptyMessage,
  currentUserId,
}: {
  title: string;
  icon: MeetingSectionIcon;
  meetings: MeetingCardProps['meeting'][];
  emptyMessage: string;
  currentUserId?: string;
}) {
  const Icon = sectionIcons[icon];

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {title}
      </h2>
      {meetings.length === 0 ? (
        <MeetingListEmpty message={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </section>
  );
}
