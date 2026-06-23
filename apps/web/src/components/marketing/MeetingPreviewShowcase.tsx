import Image from 'next/image';
import {
  LayoutGrid,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Users,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MEETING_TITLE = 'Q3 Product Strategy Review';

/** Matches production video tiles — much tighter than marketing concept art. */
const VIDEO_TILE_RADIUS = 'rounded-[4px]';

type Participant = {
  name: string;
  role: string;
  photo: string;
  active?: boolean;
  muted?: boolean;
};

const STAGE_PARTICIPANTS: Participant[] = [
  { name: 'Sarah Chen', role: 'CEO', photo: '/marketing/participants/ceo.png', active: true },
  { name: 'James Okonkwo', role: 'VP Product', photo: '/marketing/participants/pm.png' },
  { name: 'Maria Garcia', role: 'Marketing', photo: '/marketing/participants/marketing.png' },
  { name: 'David Kim', role: 'Engineering', photo: '/marketing/participants/eng.png', muted: true },
];

const DOCK_PARTICIPANTS: Participant[] = [
  { name: 'Elena Rossi', role: 'CS', photo: '/marketing/participants/cs.png' },
  { name: 'Robert Hayes', role: 'CFO', photo: '/marketing/participants/cfo.png' },
  { name: 'Aisha Patel', role: 'Sales', photo: '/marketing/participants/sales.png' },
  { name: 'Tom Bradley', role: 'Ops', photo: '/marketing/participants/ops.png' },
];

const CHAT_MESSAGES: { author: string; text: string; time: string }[] = [
  { author: 'Sarah Chen', text: "Let's finalize the Q3 launch date.", time: '2:04 PM' },
  { author: 'James Okonkwo', text: 'Budget approved — ready to scale rollout.', time: '2:05 PM' },
  { author: 'Maria Garcia', text: 'Can we review roadmap item #3?', time: '2:06 PM' },
];

function PreviewControlButton({
  icon: Icon,
  label,
  active,
  danger,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      title={label}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] sm:h-12 sm:w-12',
        danger
          ? 'bg-destructive text-white'
          : active
            ? 'bg-white text-black shadow-sm'
            : 'bg-white/12 text-white',
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function VideoTile({
  person,
  className,
}: {
  person: Participant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[#141414]',
        VIDEO_TILE_RADIUS,
        person.active &&
          'ring-2 ring-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
        className,
      )}
    >
      <Image
        src={person.photo}
        alt=""
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 50vw, 280px"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-2 py-1.5">
        <p className="truncate text-[11px] font-medium text-white">{person.name}</p>
      </div>
      {person.muted ? (
        <div className="absolute left-1.5 top-1.5 rounded-[4px] bg-black/55 p-1">
          <MicOff className="h-3 w-3 text-red-400" />
        </div>
      ) : (
        <div className="absolute left-1.5 top-1.5 rounded-[4px] bg-black/55 p-1">
          <Video className="h-3 w-3 text-white/90" />
        </div>
      )}
    </div>
  );
}

function DockTile({ person }: { person: Participant }) {
  return (
    <div
      className={cn(
        'relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-black/50 sm:h-[5.5rem] sm:w-[5.5rem]',
      )}
    >
      <Image src={person.photo} alt="" fill className="object-cover object-top" sizes="88px" />
      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
        <p className="truncate text-[9px] font-medium text-white/90">{person.name.split(' ')[0]}</p>
      </div>
    </div>
  );
}

export function MeetingPreviewShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto aspect-[16/10] w-full max-w-6xl overflow-hidden bg-[var(--meeting-bg)]',
        'shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]',
        className,
      )}
      aria-hidden
    >
      {/* Top HUD — matches MeetingRoom */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
        <div className="rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur sm:px-3 sm:py-1.5 sm:text-sm">
          {MEETING_TITLE}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-elevated)]">
          <span aria-hidden>🔴</span>
          LIVE
        </span>
      </div>

      <div className="absolute right-3 top-3 z-20 rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur sm:right-4 sm:top-4">
        You are presenting
      </div>

      {/* Main stage — speaker-style grid with production tile radius */}
      <div className="absolute inset-0 pb-[5.5rem] pr-[4.75rem] pt-12 sm:pr-[5.5rem]">
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-1 p-2 sm:gap-1.5 sm:p-3">
          <VideoTile
            person={STAGE_PARTICIPANTS[0]!}
            className="col-span-2 row-span-2 min-h-0"
          />
          <VideoTile person={STAGE_PARTICIPANTS[1]!} className="min-h-0" />
          <VideoTile person={STAGE_PARTICIPANTS[2]!} className="min-h-0" />
          <VideoTile person={STAGE_PARTICIPANTS[3]!} className="col-span-2 min-h-0" />
        </div>
      </div>

      {/* Right attendee dock — matches AttendeeDock strip */}
      <div className="absolute bottom-[5.5rem] right-0 top-12 z-10 flex w-[4.75rem] flex-col gap-1.5 overflow-hidden border-l border-white/[0.06] bg-black/20 px-1 py-2 sm:w-[5.5rem] sm:gap-2 sm:px-1.5">
        {DOCK_PARTICIPANTS.map((person) => (
          <DockTile key={person.name} person={person} />
        ))}
      </div>

      {/* Chat panel — matches production overlay (glass, rounded-meeting) */}
      <div className="absolute bottom-[5.5rem] right-[4.75rem] top-12 z-20 hidden w-[min(42%,13rem)] flex-col overflow-hidden meeting-glass-panel rounded-[var(--radius-meeting)] sm:flex lg:w-56">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Chat</h3>
            <p className="text-[10px] text-white/40">Everyone</p>
          </div>
          <X className="h-4 w-4 text-white/50" />
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-3">
          {CHAT_MESSAGES.map((msg) => (
            <div key={msg.text}>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-medium text-white/80">{msg.author}</span>
                <span className="text-[10px] text-white/30">{msg.time}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-white/90">{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-2">
          <div className="rounded-[var(--radius-md)] bg-white/10 px-2.5 py-2 text-[10px] text-white/40">
            Type a message...
          </div>
        </div>
      </div>

      {/* Reactions — matches ReactionsOverlay placement */}
      <div className="pointer-events-none absolute bottom-28 left-[18%] z-10 text-3xl">👏</div>
      <div className="pointer-events-none absolute bottom-36 left-[28%] z-10 text-3xl">❤️</div>

      {/* Controls bar — matches ControlsBar / meeting-controls-float */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-3 pt-8 sm:px-6 sm:pb-4">
        <div className="pointer-events-auto meeting-controls-float mx-auto flex max-w-lg items-center justify-center gap-1 px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
          <PreviewControlButton icon={Mic} label="Mute" active />
          <PreviewControlButton icon={Video} label="Stop video" active />
          <PreviewControlButton icon={MonitorUp} label="Share screen" active />
          <PreviewControlButton icon={MessageSquare} label="Chat" active />
          <PreviewControlButton icon={Users} label="Participants" />
          <PreviewControlButton icon={LayoutGrid} label="Layout" />
          <PreviewControlButton icon={MoreHorizontal} label="More options" />
          <div className="mx-1 h-8 w-px shrink-0 bg-white/20" />
          <PreviewControlButton icon={LogOut} label="Leave meeting" danger />
        </div>
      </div>
    </div>
  );
}
