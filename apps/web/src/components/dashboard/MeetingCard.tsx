'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, ChevronUp, History, Radio, Users, Video, type LucideIcon } from 'lucide-react';
import { formatMeetingCode } from '@boldmeet/shared';
import { getMeetingInviteUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { cardClass, ui } from '@/lib/ui';
import { api } from '@/lib/api';
import { CopyButton } from './CopyButton';
import { Button } from '@/components/ui/Button';

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
  SCHEDULED: { label: 'Scheduled', className: 'bg-muted text-muted-foreground' },
  LIVE: { label: 'Live', className: 'bg-success/10 text-success' },
  ENDED: { label: 'Ended', className: 'bg-muted text-muted-foreground/70' },
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
    <div className={cardClass({ className: 'p-5 sm:p-6 transition-all duration-200 hover:shadow-[var(--shadow-elevated)]' })}>
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
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--primary-hover)]"
                  >
                    Join
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={handleEndMeeting}
                    disabled={actionLoading}
                    loading={actionLoading}
                  >
                    End Meeting
                  </Button>
                  <CopyButton text={inviteLink} label="Copy Invite Link" className="w-full" />
                </>
              )}
              {isLive && !isHost && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={handleLeaveMeeting}
                  disabled={actionLoading}
                  loading={actionLoading}
                >
                  Leave Meeting
                </Button>
              )}
              {!isLive && (
                <Link
                  href={`/meeting/${meeting.meetingCode}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--primary-hover)]"
                >
                  Start
                </Link>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full gap-1"
                onClick={() => setDetailsOpen((open) => !open)}
              >
                Details
                {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
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
        <div className="mt-4 space-y-3 rounded-[var(--radius-md)] bg-muted/60 p-4 sm:p-5">
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
          </div>
        </div>
      )}
    </div>
  );
}

export function MeetingListEmpty({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className={cn(cardClass(), 'border border-dashed border-border/80 p-12 text-center')}>
      <Video className="mx-auto h-10 w-10 text-muted-foreground/50" />
      <p className="mt-4 text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline">
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
      <h2 className={cn('mb-5 flex items-center gap-2', ui.sectionTitle)}>
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
