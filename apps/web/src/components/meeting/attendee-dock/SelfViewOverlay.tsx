'use client';

import { useCallback, useRef } from 'react';
import type { SelfViewMode } from '@/lib/attendee-layout-prefs';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'You';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function SelfViewOverlay({
  mode,
  displayName,
  floating,
  onFloatingChange,
}: {
  mode: SelfViewMode;
  displayName: string;
  floating: { x: number; y: number; width: number; height: number };
  onFloatingChange: (patch: Partial<{ x: number; y: number; width: number; height: number }>) => void;
}) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  if (mode !== 'floating') {
    return null;
  }

  const onPointerDown = (event: React.PointerEvent) => {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: floating.x,
      oy: floating.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragRef.current) return;
      onFloatingChange({
        x: Math.max(8, dragRef.current.ox + (event.clientX - dragRef.current.x)),
        y: Math.max(56, dragRef.current.oy + (event.clientY - dragRef.current.y)),
      });
    },
    [onFloatingChange],
  );

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded-[6px] border border-white/15 bg-black/70 shadow-[var(--shadow-elevated)] backdrop-blur"
      style={{
        left: floating.x,
        top: floating.y,
        width: floating.width,
        height: floating.height,
      }}
    >
      <div
        className="cursor-grab border-b border-white/10 px-2 py-1 text-[9px] font-medium text-white/60 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        You
      </div>
      <div className="flex flex-1 items-center justify-center text-lg font-bold text-white">
        {initials(displayName)}
      </div>
    </div>
  );
}
