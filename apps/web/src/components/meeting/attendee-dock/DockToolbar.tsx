'use client';

import {
  ChevronDown,
  Grid3X3,
  Minus,
  PanelRight,
  PanelTop,
  Plus,
  User,
  Users,
} from 'lucide-react';
import type {
  DockPosition,
  DockViewMode,
  StageLayout,
} from '@/lib/attendee-layout-prefs';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function DockToolbar({
  dockCollapsed,
  dockPosition,
  dockViewMode,
  stageLayout,
  isWebinar,
  isScreenShareContext,
  onToggleCollapsed,
  onSetStageLayout,
  onSetDockPosition,
  onSetDockViewMode,
  orientation,
}: {
  dockCollapsed: boolean;
  dockPosition: DockPosition;
  dockViewMode: DockViewMode;
  stageLayout: StageLayout;
  isWebinar?: boolean;
  isScreenShareContext?: boolean;
  onToggleCollapsed: () => void;
  onSetStageLayout: (layout: StageLayout) => void;
  onSetDockPosition: (position: DockPosition) => void;
  onSetDockViewMode: (mode: DockViewMode) => void;
  orientation: 'vertical' | 'horizontal';
}) {
  const [positionOpen, setPositionOpen] = useState(false);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 border-b border-white/10 bg-black/40 px-1.5 py-1.5',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      )}
    >
      <button
        type="button"
        title={dockCollapsed ? 'Expand dock' : 'Collapse dock'}
        onClick={onToggleCollapsed}
        className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        {dockCollapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      </button>

      <button
        type="button"
        title="Speaker view"
        onClick={() => onSetStageLayout('speaker')}
        className={cn(
          'flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold transition',
          stageLayout === 'speaker'
            ? 'bg-white text-black'
            : 'text-white/75 hover:bg-white/10 hover:text-white',
        )}
      >
        <User className="h-3 w-3" />
        {orientation === 'horizontal' ? <span>Speaker</span> : null}
      </button>

      <button
        type="button"
        title="Grid view"
        onClick={() => onSetStageLayout('grid')}
        className={cn(
          'flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold transition',
          stageLayout === 'grid'
            ? 'bg-white text-black'
            : 'text-white/75 hover:bg-white/10 hover:text-white',
        )}
      >
        <Grid3X3 className="h-3 w-3" />
        {orientation === 'horizontal' ? <span>Grid</span> : null}
      </button>

      {!isWebinar && (
        <button
          type="button"
          title={dockViewMode === 'speaker' ? 'Active speaker strip' : 'All participants'}
          onClick={() =>
            onSetDockViewMode(dockViewMode === 'speaker' ? 'participants' : 'speaker')
          }
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {dockViewMode === 'speaker' ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Users className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          title="Dock position"
          onClick={() => setPositionOpen((v) => !v)}
          className="flex h-7 items-center gap-0.5 rounded-md px-1.5 text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {dockPosition === 'top' ? (
            <PanelTop className="h-3.5 w-3.5" />
          ) : dockPosition === 'hidden' ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <PanelRight className="h-3.5 w-3.5" />
          )}
          <ChevronDown className="h-3 w-3" />
        </button>
        {positionOpen && (
          <div
            className={cn(
              'absolute z-50 min-w-[7.5rem] rounded-lg border border-white/10 bg-black/90 py-1 shadow-lg backdrop-blur',
              orientation === 'vertical' ? 'left-full top-0 ml-1' : 'bottom-full left-0 mb-1',
            )}
          >
            {(
              [
                { id: 'right' as const, label: 'Right dock', icon: PanelRight },
                { id: 'top' as const, label: 'Top dock', icon: PanelTop },
                { id: 'hidden' as const, label: 'Hidden', icon: Minus },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSetDockPosition(id);
                  setPositionOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-white/85 hover:bg-white/10',
                  dockPosition === id && 'bg-white/10 font-semibold',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {(isWebinar || isScreenShareContext) && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/55">
          {isWebinar ? 'Webinar' : 'Presenting'}
        </span>
      )}
    </div>
  );
}
