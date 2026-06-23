'use client';

import { useRef } from 'react';
import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import { cn } from '@/lib/utils';

const DOUBLE_TAP_MS = 320;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function DockThumbnailTile({
  participant,
  isSpeaking,
  isPinned,
  showName,
  showSpeakerIndicator,
  sizePx,
  onPinToggle,
  horizontal,
}: {
  participant: JitsiRosterParticipant;
  isSpeaking: boolean;
  isPinned: boolean;
  showName: boolean;
  showSpeakerIndicator: boolean;
  sizePx: number;
  onPinToggle: (id: string) => void;
  horizontal?: boolean;
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
        'relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-[6px] bg-black/55 text-white transition-all duration-200',
        isPinned && 'ring-2 ring-white',
        isSpeaking &&
          showSpeakerIndicator &&
          'ring-2 ring-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.45)]',
      )}
      style={{
        width: sizePx,
        height: horizontal ? sizePx : sizePx,
        minWidth: sizePx,
        minHeight: sizePx,
      }}
      title={`${participant.displayName} — double-tap to ${isPinned ? 'unpin' : 'pin'}`}
    >
      <span className="text-sm font-semibold">{initials(participant.displayName)}</span>
      {showName ? (
        <span className="mt-0.5 max-w-full truncate px-1 text-[9px] text-white/75">
          {participant.displayName.split(' ')[0]}
        </span>
      ) : null}
      {isPinned ? (
        <span className="absolute right-0.5 top-0.5 rounded bg-white/20 px-1 text-[8px] font-bold">
          PIN
        </span>
      ) : null}
    </button>
  );
}
