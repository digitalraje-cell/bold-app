'use client';

import { cn } from '@/lib/utils';

type WireframeId =
  | 'right-dock'
  | 'top-dock'
  | 'hidden-dock'
  | 'speaker-view'
  | 'grid-view'
  | 'floating-self'
  | 'webinar'
  | 'screen-share';

interface WireframeSpec {
  id: WireframeId;
  title: string;
  subtitle: string;
}

const WIREFRAMES: WireframeSpec[] = [
  {
    id: 'right-dock',
    title: 'Right Dock',
    subtitle: 'Vertical thumbnail strip with collapse toolbar',
  },
  {
    id: 'top-dock',
    title: 'Top Dock',
    subtitle: 'Horizontal filmstrip above the stage',
  },
  {
    id: 'hidden-dock',
    title: 'Hidden Dock',
    subtitle: 'Full-width stage; restore chip top-right',
  },
  {
    id: 'speaker-view',
    title: 'Speaker View',
    subtitle: 'Dominant speaker on stage, dock shows roster',
  },
  {
    id: 'grid-view',
    title: 'Grid View',
    subtitle: 'Equal tiles; dock optional for quick focus',
  },
  {
    id: 'floating-self',
    title: 'Floating Self View',
    subtitle: 'Draggable self preview over the stage',
  },
  {
    id: 'webinar',
    title: 'Webinar Mode',
    subtitle: 'Presenter on stage; audience in dock only',
  },
  {
    id: 'screen-share',
    title: 'Screen Sharing',
    subtitle: 'Share fills stage; dock moves to top strip',
  },
];

function Stage({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex flex-1 items-center justify-center overflow-hidden rounded-md bg-[#1e293b] text-[10px] font-medium text-white/50',
        className,
      )}
    >
      {children ?? 'Stage'}
    </div>
  );
}

function Thumb({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-full w-full shrink-0 items-center justify-center rounded-[4px] bg-[#334155] text-[8px] font-semibold text-white/70',
        active && 'ring-2 ring-[var(--color-primary)]',
      )}
    >
      {label}
    </div>
  );
}

function ControlsBarMock() {
  return (
    <div className="flex h-7 shrink-0 items-center justify-center gap-1 rounded-t-md border-t border-white/10 bg-black/80 px-2">
      {['Mic', 'Cam', 'Share', '•••', 'Leave'].map((label) => (
        <div
          key={label}
          className={cn(
            'rounded px-1.5 py-0.5 text-[7px] font-medium',
            label === 'Leave' ? 'bg-red-600/80 text-white' : 'bg-white/10 text-white/70',
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function RightDockMock({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex w-14 shrink-0 flex-col gap-1 border-l border-white/10 bg-black/70 p-1">
      <div className="flex h-5 items-center justify-center rounded bg-white/10 text-[7px] text-white/60">
        {collapsed ? '»' : '« Dock'}
      </div>
      {!collapsed && (
        <div className="flex flex-1 flex-col gap-1">
          <Thumb label="A" active />
          <Thumb label="B" />
          <Thumb label="C" />
        </div>
      )}
    </div>
  );
}

function TopDockMock() {
  return (
    <div className="flex h-12 shrink-0 gap-1 border-b border-white/10 bg-black/70 p-1">
      <div className="flex h-full w-8 items-center justify-center rounded bg-white/10 text-[7px] text-white/60">
        Dock
      </div>
      <div className="h-full w-14">
        <Thumb label="A" active />
      </div>
      <div className="h-full w-14">
        <Thumb label="B" />
      </div>
      <div className="h-full w-14">
        <Thumb label="C" />
      </div>
    </div>
  );
}

function MeetingChrome({
  id,
  children,
  topDock,
  rightDock,
  hiddenChip,
  floatingSelf,
  hud,
}: {
  id: WireframeId;
  children: React.ReactNode;
  topDock?: boolean;
  rightDock?: boolean | 'collapsed';
  hiddenChip?: boolean;
  floatingSelf?: boolean;
  hud?: React.ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-semibold text-foreground">
        {WIREFRAMES.find((w) => w.id === id)?.title}
      </figcaption>
      <p className="text-xs text-muted-foreground">
        {WIREFRAMES.find((w) => w.id === id)?.subtitle}
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-[#0f172a] shadow-[var(--shadow-elevated)]">
        {hud}
        <div className="flex min-h-[180px] flex-col">
          {topDock ? <TopDockMock /> : null}
          <div className="relative flex min-h-0 flex-1">
            {children}
            {rightDock ? (
              <RightDockMock collapsed={rightDock === 'collapsed'} />
            ) : null}
            {hiddenChip ? (
              <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[8px] text-white/80">
                Attendees
              </div>
            ) : null}
            {floatingSelf ? (
              <div className="absolute bottom-10 right-16 h-12 w-16 rounded border border-white/20 bg-black/80 text-center text-[7px] leading-[3rem] text-white/60">
                You
              </div>
            ) : null}
          </div>
        </div>
        <ControlsBarMock />
      </div>
    </figure>
  );
}

function WireframeCanvas({ id }: { id: WireframeId }) {
  switch (id) {
    case 'right-dock':
      return (
        <MeetingChrome id={id} rightDock>
          <Stage>
            <span className="text-xs text-white/60">Active speaker</span>
          </Stage>
        </MeetingChrome>
      );
    case 'top-dock':
      return (
        <MeetingChrome id={id} topDock>
          <Stage>
            <span className="text-xs text-white/60">Active speaker</span>
          </Stage>
        </MeetingChrome>
      );
    case 'hidden-dock':
      return (
        <MeetingChrome id={id} hiddenChip>
          <Stage>
            <span className="text-xs text-white/60">Full stage</span>
          </Stage>
        </MeetingChrome>
      );
    case 'speaker-view':
      return (
        <MeetingChrome id={id} rightDock>
          <Stage>
            <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-[#475569] text-sm font-bold text-white">
              Speaker
            </div>
          </Stage>
        </MeetingChrome>
      );
    case 'grid-view':
      return (
        <MeetingChrome id={id} rightDock="collapsed">
          <Stage className="gap-1 p-2">
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
              {['A', 'B', 'C', 'D'].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-center rounded bg-[#475569] text-[9px] font-bold text-white"
                >
                  {label}
                </div>
              ))}
            </div>
          </Stage>
        </MeetingChrome>
      );
    case 'floating-self':
      return (
        <MeetingChrome id={id} rightDock floatingSelf>
          <Stage>
            <span className="text-xs text-white/60">Main stage</span>
          </Stage>
        </MeetingChrome>
      );
    case 'webinar':
      return (
        <MeetingChrome
          id={id}
          rightDock
          hud={
            <div className="border-b border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[8px] font-medium text-amber-200">
              Webinar — audience view-only
            </div>
          }
        >
          <Stage>
            <div className="text-center">
              <div className="text-sm font-bold text-white">Host</div>
              <div className="mt-1 text-[8px] text-white/50">Stage presenter</div>
            </div>
          </Stage>
        </MeetingChrome>
      );
    case 'screen-share':
      return (
        <MeetingChrome id={id} topDock>
          <Stage className="bg-[#0c1222]">
            <div className="absolute inset-2 rounded border border-dashed border-white/20 bg-[#111827] p-2 text-[8px] text-white/40">
              Shared screen
            </div>
          </Stage>
        </MeetingChrome>
      );
    default:
      return null;
  }
}

export function AttendeeDockWireframes({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'grid gap-8',
        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
      )}
    >
      {WIREFRAMES.map((spec) => (
        <WireframeCanvas key={spec.id} id={spec.id} />
      ))}
    </div>
  );
}
