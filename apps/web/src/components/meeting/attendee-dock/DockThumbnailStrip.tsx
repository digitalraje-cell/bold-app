'use client';

import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import { DockThumbnailTile } from '@/components/meeting/attendee-dock/DockThumbnailTile';
import { cn } from '@/lib/utils';

const TILE_PX = 72;

export function DockThumbnailStrip({
  participants,
  dominantSpeakerId,
  pinnedParticipantId,
  showName,
  showSpeakerIndicator,
  orientation,
  onPinToggle,
  className,
}: {
  participants: JitsiRosterParticipant[];
  dominantSpeakerId: string | null;
  pinnedParticipantId: string | null;
  showName: boolean;
  showSpeakerIndicator: boolean;
  orientation: 'vertical' | 'horizontal';
  onPinToggle: (id: string) => void;
  className?: string;
}) {
  if (participants.length === 0) {
    return (
      <p className={cn('px-2 py-3 text-center text-[10px] text-white/45', className)}>
        No participants
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 gap-1.5 overflow-auto scroll-smooth p-1.5',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {participants.map((participant) => (
        <DockThumbnailTile
          key={participant.id}
          participant={participant}
          isSpeaking={dominantSpeakerId === participant.id}
          isPinned={pinnedParticipantId === participant.id}
          showName={showName}
          showSpeakerIndicator={showSpeakerIndicator}
          sizePx={TILE_PX}
          onPinToggle={onPinToggle}
          horizontal={orientation === 'horizontal'}
        />
      ))}
    </div>
  );
}
