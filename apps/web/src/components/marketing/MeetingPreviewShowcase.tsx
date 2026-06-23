import { Mic, MonitorUp, MessageSquare, Users, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

const PARTICIPANTS = [
  { name: 'Sarah Chen', active: true, tone: 'from-violet-400 to-purple-600' },
  { name: 'James Okonkwo', active: false, tone: 'from-indigo-400 to-blue-600' },
  { name: 'Maria Garcia', active: false, tone: 'from-fuchsia-400 to-pink-600' },
  { name: 'David Kim', active: false, tone: 'from-sky-400 to-cyan-600' },
  { name: 'Aisha Patel', active: false, tone: 'from-amber-400 to-orange-600' },
  { name: 'Elena Rossi', active: false, tone: 'from-emerald-400 to-teal-600' },
  { name: 'Tom Bradley', active: false, tone: 'from-rose-400 to-red-600' },
  { name: 'Nina Weber', active: false, tone: 'from-lime-400 to-green-600' },
  { name: 'Alex Morgan', active: false, tone: 'from-purple-400 to-violet-700' },
] as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

export function MeetingPreviewShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-border/60 bg-[#0c0c0e] shadow-[var(--shadow-elevated)]',
        'ring-1 ring-black/5',
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#141416] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
            <Radio className="h-3 w-3" />
            Live
          </span>
          <span className="text-xs font-medium text-white/70">Product Strategy Review</span>
        </div>
        <div className="hidden items-center gap-2 text-white/50 sm:flex">
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs">9 participants</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px]">
        <div className="relative p-3 sm:p-4">
          <div className="mb-3 hidden rounded-xl border border-white/10 bg-white/5 p-2 sm:block">
            <div className="flex items-center gap-2 text-[10px] font-medium text-white/60">
              <MonitorUp className="h-3.5 w-3.5 text-[var(--accent-purple-light)]" />
              Screen share — Q4 roadmap deck
            </div>
            <div className="mt-2 grid h-16 grid-cols-4 gap-1.5 rounded-lg bg-gradient-to-br from-[var(--accent-purple-dark)]/40 to-[var(--accent-purple)]/20 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded bg-white/10" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {PARTICIPANTS.map((person) => (
              <div
                key={person.name}
                className={cn(
                  'relative aspect-video overflow-hidden rounded-xl bg-[#1c1c1f]',
                  person.active && 'ring-2 ring-[var(--accent-purple-light)] ring-offset-2 ring-offset-[#0c0c0e]',
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-90',
                    person.tone,
                  )}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white/90 sm:text-xl">
                    {initials(person.name)}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                  <p className="truncate text-[10px] font-medium text-white sm:text-xs">
                    {person.name}
                    {person.active ? ' · Speaking' : ''}
                  </p>
                </div>
                {person.active && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-purple)]">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
            {[
              { icon: Mic, label: 'Mute' },
              { icon: MonitorUp, label: 'Share' },
              { icon: MessageSquare, label: 'Chat' },
              { icon: Users, label: 'People' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 sm:h-9 sm:w-9"
                title={label}
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
            <div className="ml-1 h-8 rounded-lg bg-red-500/90 px-3 text-[10px] font-semibold leading-8 text-white sm:h-9 sm:px-4 sm:text-xs sm:leading-9">
              Leave
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-white/10 bg-[#111113] p-3 lg:block">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80">
            <MessageSquare className="h-3.5 w-3.5" />
            Meeting chat
          </div>
          <div className="space-y-2.5 text-[11px] leading-relaxed">
            <div>
              <p className="font-semibold text-[var(--accent-purple-light)]">Sarah Chen</p>
              <p className="text-white/70">Great walkthrough — can we share the deck after?</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">James Okonkwo</p>
              <p className="text-white/70">Yes, I&apos;ll post it in the channel.</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Host</p>
              <p className="text-white/70">Recording is live on YouTube.</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-white/40">
            Type a message…
          </div>
        </aside>
      </div>

      <div className="pointer-events-none absolute -inset-px rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-purple-light)]/20 via-transparent to-[var(--accent-purple-dark)]/10" />
    </div>
  );
}
