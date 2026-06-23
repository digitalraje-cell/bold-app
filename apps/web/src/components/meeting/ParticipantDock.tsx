'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import {
  THUMBNAIL_SIZE_PX,
  type MeetingLayoutPrefs,
  type ParticipantDockPosition,
} from '@/lib/meeting-layout-prefs';
import { cn } from '@/lib/utils';

const DOUBLE_TAP_MS = 320;

interface ParticipantDockProps {
  participants: JitsiRosterParticipant[];
  dominantSpeakerId: string | null;
  pinnedParticipantId: string | null;
  prefs: MeetingLayoutPrefs;
  onPinToggle: (participantId: string) => void;
  onFloatingDockChange: (patch: Partial<MeetingLayoutPrefs['floatingDock']>) => void;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function VirtualizedStrip({
  items,
  orientation,
  itemSize,
  renderItem,
}: {
  items: JitsiRosterParticipant[];
  orientation: 'horizontal' | 'vertical';
  itemSize: number;
  renderItem: (item: JitsiRosterParticipant) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportSize, setViewportSize] = useState(orientation === 'vertical' ? 320 : 120);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollOffset(orientation === 'vertical' ? el.scrollTop : el.scrollLeft);
  }, [orientation]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setViewportSize(orientation === 'vertical' ? el.clientHeight : el.clientWidth);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [orientation, items.length]);

  const overscan = 2;
  const start = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan);
  const visibleCount = Math.ceil(viewportSize / itemSize) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);

  const paddingBefore = start * itemSize;
  const paddingAfter = Math.max(0, (items.length - end) * itemSize);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={cn(
        'flex scroll-smooth',
        orientation === 'vertical'
          ? 'h-full flex-col overflow-y-auto overflow-x-hidden'
          : 'w-full flex-row overflow-x-auto overflow-y-hidden',
      )}
    >
      <div style={orientation === 'vertical' ? { height: paddingBefore } : { width: paddingBefore }} />
      {slice.map((item) => (
        <div
          key={item.id}
          className="shrink-0"
          style={
            orientation === 'vertical'
              ? { height: itemSize, paddingBottom: 8 }
              : { width: itemSize, paddingRight: 8 }
          }
        >
          {renderItem(item)}
        </div>
      ))}
      <div style={orientation === 'vertical' ? { height: paddingAfter } : { width: paddingAfter }} />
    </div>
  );
}

function ThumbnailTile({
  participant,
  isSpeaking,
  isPinned,
  showName,
  showSpeakerIndicator,
  sizePx,
  minimized,
  onPinToggle,
}: {
  participant: JitsiRosterParticipant;
  isSpeaking: boolean;
  isPinned: boolean;
  showName: boolean;
  showSpeakerIndicator: boolean;
  sizePx: number;
  minimized: boolean;
  onPinToggle: (id: string) => void;
}) {
  const lastTapRef = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      onPinToggle(participant.id);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-black/50 text-white transition-all duration-200',
        isPinned && 'ring-2 ring-white',
        isSpeaking && showSpeakerIndicator && 'ring-2 ring-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.45)]',
        minimized ? 'opacity-90' : 'opacity-100',
      )}
      style={{ width: sizePx, height: sizePx }}
      title={`${participant.displayName} — double-tap to ${isPinned ? 'unpin' : 'pin'}`}
      aria-label={`${participant.displayName}, double-tap to ${isPinned ? 'unpin' : 'pin'}`}
    >
      <span className="text-sm font-semibold">{initials(participant.displayName)}</span>
      {showName && !minimized ? (
        <span className="mt-1 max-w-full truncate px-1 text-[10px] text-white/80">
          {participant.displayName}
        </span>
      ) : null}
      {isPinned ? (
        <span className="absolute right-1 top-1 rounded bg-white/20 px-1 text-[9px] font-semibold">
          PIN
        </span>
      ) : null}
    </button>
  );
}

function useDockOrientation(position: ParticipantDockPosition): 'horizontal' | 'vertical' {
  return position === 'TOP' || position === 'BOTTOM' ? 'horizontal' : 'vertical';
}

export function ParticipantDock({
  participants,
  dominantSpeakerId,
  pinnedParticipantId,
  prefs,
  onPinToggle,
  onFloatingDockChange,
  className,
}: ParticipantDockProps) {
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const visibleParticipants = useMemo(() => {
    if (prefs.thumbnailPanelMode === 'single') {
      const targetId = pinnedParticipantId ?? dominantSpeakerId ?? participants[0]?.id;
      const match = participants.find((p) => p.id === targetId);
      return match ? [match] : participants.slice(0, 1);
    }
    return participants;
  }, [dominantSpeakerId, participants, pinnedParticipantId, prefs.thumbnailPanelMode]);

  const sizePx = THUMBNAIL_SIZE_PX[prefs.thumbnailSize];
  const minimized = prefs.thumbnailPanelMode === 'minimized';
  const tileSize = minimized ? Math.round(sizePx * 0.75) : sizePx;
  const orientation = useDockOrientation(prefs.dockPosition);

  if (prefs.thumbnailPanelMode === 'hidden' || visibleParticipants.length === 0) {
    return null;
  }

  const renderTile = (participant: JitsiRosterParticipant) => (
    <ThumbnailTile
      participant={participant}
      isSpeaking={dominantSpeakerId === participant.id}
      isPinned={pinnedParticipantId === participant.id}
      showName={prefs.showParticipantNames}
      showSpeakerIndicator={prefs.showActiveSpeakerIndicator}
      sizePx={tileSize}
      minimized={minimized}
      onPinToggle={onPinToggle}
    />
  );

  const strip = (
    <VirtualizedStrip
      items={visibleParticipants}
      orientation={orientation}
      itemSize={tileSize + 8}
      renderItem={renderTile}
    />
  );

  if (prefs.dockPosition === 'FLOATING' && isDesktop) {
    const { x, y, width, height, collapsed } = prefs.floatingDock;

    const onPointerDown = (event: React.PointerEvent) => {
      dragRef.current = { x: event.clientX, y: event.clientY, originX: x, originY: y };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      onFloatingDockChange({
        x: Math.max(8, dragRef.current.originX + dx),
        y: Math.max(8, dragRef.current.originY + dy),
      });
    };

    const onPointerUp = () => {
      dragRef.current = null;
    };

    return (
      <div
        className={cn(
          'pointer-events-auto absolute z-30 flex flex-col rounded-[var(--radius-lg)] border border-white/10 bg-black/60 shadow-[var(--shadow-elevated)] backdrop-blur',
          className,
        )}
        style={{ left: x, top: y, width, height: collapsed ? 'auto' : height }}
      >
        <div
          className="flex cursor-grab items-center justify-between border-b border-white/10 px-2 py-1.5 text-xs text-white/80 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <span>Participants</span>
          <button
            type="button"
            className="rounded px-2 py-0.5 hover:bg-white/10"
            onClick={() => onFloatingDockChange({ collapsed: !collapsed })}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        {!collapsed ? <div className="min-h-0 flex-1 p-2">{strip}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-auto meeting-participant-dock',
        `meeting-participant-dock--${prefs.dockPosition.toLowerCase()}`,
        minimized && 'meeting-participant-dock--minimized',
        className,
      )}
    >
      {strip}
    </div>
  );
}
