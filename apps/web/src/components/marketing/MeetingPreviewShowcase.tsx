import Image from 'next/image';
import {
  Circle,
  Hand,
  MessageSquare,
  Mic,
  MonitorUp,
  PhoneOff,
  Smile,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MEETING_TITLE = 'Q3 Product Strategy Review';

type Participant = {
  name: string;
  role: string;
  photo: string;
  active?: boolean;
  raisedHand?: boolean;
  reaction?: string;
};

const PARTICIPANTS: Participant[] = [
  { name: 'Sarah Chen', role: 'CEO', photo: '/marketing/participants/ceo.png', active: true },
  { name: 'James Okonkwo', role: 'VP Product', photo: '/marketing/participants/pm.png', raisedHand: true },
  { name: 'David Kim', role: 'Engineering Lead', photo: '/marketing/participants/eng.png' },
  { name: 'Maria Garcia', role: 'Marketing Director', photo: '/marketing/participants/marketing.png', reaction: '👏' },
  { name: 'Elena Rossi', role: 'Customer Success', photo: '/marketing/participants/cs.png' },
  { name: 'Robert Hayes', role: 'CFO', photo: '/marketing/participants/cfo.png' },
  { name: 'Aisha Patel', role: 'Sales Director', photo: '/marketing/participants/sales.png', reaction: '❤️' },
  { name: 'Tom Bradley', role: 'Operations Lead', photo: '/marketing/participants/ops.png' },
];

const CHAT_MESSAGES: { author: string; text: string; highlight?: boolean }[] = [
  { author: 'Sarah Chen', text: "Let's finalize the Q3 launch date.", highlight: true },
  { author: 'James Okonkwo', text: 'Budget approved — ready to scale rollout.' },
  { author: 'Maria Garcia', text: 'Can we review roadmap item #3?' },
  { author: 'Robert Hayes', text: 'Finance is aligned on the timeline.' },
];

const TOOLBAR: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  record?: boolean;
}[] = [
  { icon: Mic, label: 'Mic' },
  { icon: Video, label: 'Camera' },
  { icon: MonitorUp, label: 'Share Screen', active: true },
  { icon: MessageSquare, label: 'Chat' },
  { icon: Users, label: 'Participants' },
  { icon: Hand, label: 'Raise Hand' },
  { icon: Smile, label: 'Reactions' },
  { icon: Circle, label: 'Recording', record: true },
];

export function MeetingPreviewShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-6xl overflow-hidden rounded-[var(--radius-xl)] border border-black/10 bg-[#08080a] shadow-[var(--shadow-float)]',
        'ring-1 ring-[var(--accent-purple)]/15',
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101012] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-400 ring-1 ring-red-500/30">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-600/35">
            <Circle className="h-2.5 w-2.5 fill-current" />
            Rec
          </span>
          <span className="truncate text-sm font-semibold text-white/92">{MEETING_TITLE}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-white/50">
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">{PARTICIPANTS.length} in meeting</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_260px]">
        <div className="relative p-3 sm:p-4">
          <div className="mb-3 overflow-hidden rounded-xl border border-[var(--accent-purple)]/25 bg-[#12121a]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] font-medium text-white/70">
              <MonitorUp className="h-3.5 w-3.5 text-[var(--accent-purple-light)]" />
              Screen share — Q3 roadmap & revenue targets
            </div>
            <div className="grid grid-cols-4 gap-2 p-3">
              {['Revenue', 'Roadmap', 'Launch', 'KPIs'].map((label) => (
                <div
                  key={label}
                  className="flex h-14 flex-col justify-end rounded-lg bg-gradient-to-br from-[var(--accent-purple-dark)]/50 to-[var(--accent-purple)]/20 p-2"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                    {label}
                  </span>
                  <div className="mt-1 h-1.5 rounded-full bg-white/20" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {PARTICIPANTS.map((person, index) => (
              <div
                key={person.name}
                className={cn(
                  'relative aspect-[4/3] overflow-hidden rounded-xl bg-[#16161a]',
                  index === 0 && 'col-span-2 row-span-2 aspect-[16/11] sm:aspect-auto sm:min-h-[168px]',
                  person.active &&
                    'ring-2 ring-[var(--accent-purple-light)] ring-offset-2 ring-offset-[#08080a]',
                )}
              >
                <Image
                  src={person.photo}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 45vw, 200px"
                  priority={index < 3}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <p className="truncate text-[11px] font-semibold text-white sm:text-xs">{person.name}</p>
                  <p className="truncate text-[9px] text-white/60 sm:text-[10px]">{person.role}</p>
                </div>
                {person.active && (
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[var(--accent-purple)] px-2 py-0.5 text-[9px] font-bold text-white sm:text-[10px]">
                    <Mic className="h-3 w-3" />
                    Speaking
                  </div>
                )}
                {person.raisedHand && (
                  <div className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-lg">
                    <Hand className="h-3.5 w-3.5" />
                  </div>
                )}
                {person.reaction && (
                  <div className="absolute right-1.5 bottom-10 text-lg drop-shadow-md sm:bottom-12 sm:text-xl">
                    {person.reaction}
                  </div>
                )}
                <div className="absolute left-1.5 top-1.5 rounded-md bg-black/45 p-0.5 backdrop-blur-sm sm:p-1">
                  <Video className="h-3 w-3 text-white/90" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute right-6 top-24 hidden flex-col gap-2 lg:flex">
            {['👏', '🎉', '❤️'].map((emoji) => (
              <span
                key={emoji}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-base backdrop-blur-md"
              >
                {emoji}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#121214]/95 px-3 py-2.5 backdrop-blur-md sm:gap-2">
            {TOOLBAR.map(({ icon: Icon, label, active, record }) => (
              <div
                key={label}
                title={label}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10',
                  active
                    ? 'bg-white text-black'
                    : record
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                      : 'bg-white/10 text-white/85',
                )}
              >
                <Icon className={cn('h-4 w-4', record && 'fill-current')} />
              </div>
            ))}
            <div className="ml-1 flex h-9 items-center rounded-xl bg-red-600 px-3 text-xs font-semibold text-white sm:h-10 sm:px-4">
              <PhoneOff className="mr-1.5 h-3.5 w-3.5" />
              End
            </div>
          </div>
        </div>

        <aside className="flex flex-col border-t border-white/10 bg-[#0c0c0e] lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <MessageSquare className="h-4 w-4 text-[var(--accent-purple-light)]" />
              Chat
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
              Everyone
            </span>
          </div>
          <div className="max-h-64 flex-1 space-y-4 overflow-hidden p-4 lg:max-h-none">
            {CHAT_MESSAGES.map((msg) => (
              <div key={msg.text}>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    msg.highlight ? 'text-[var(--accent-purple-light)]' : 'text-white/80',
                  )}
                >
                  {msg.author}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/65">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/35">
              Type a message…
            </div>
          </div>
        </aside>
      </div>

      <div className="pointer-events-none absolute -inset-px rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-purple-light)]/12 via-transparent to-[var(--accent-purple-dark)]/10" />
    </div>
  );
}
