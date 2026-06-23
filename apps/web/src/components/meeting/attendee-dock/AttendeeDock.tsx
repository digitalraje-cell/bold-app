'use client';

import { useRef } from 'react';
import { PanelRight } from 'lucide-react';
import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import type { AttendeeLayoutPrefs } from '@/lib/attendee-layout-prefs';
import { DockThumbnailStrip } from '@/components/meeting/attendee-dock/DockThumbnailStrip';
import { DockToolbar } from '@/components/meeting/attendee-dock/DockToolbar';
import { cn } from '@/lib/utils';

interface AttendeeDockProps {
  effectivePrefs: AttendeeLayoutPrefs;
  participants: JitsiRosterParticipant[];
  dominantSpeakerId: string | null;
  pinnedParticipantId: string | null;
  isWebinar: boolean;
  isScreenShareContext: boolean;
  onPinToggle: (participantId: string) => void;
  onToggleCollapsed: () => void;
  onSetStageLayout: (layout: AttendeeLayoutPrefs['stageLayout']) => void;
  onSetDockPosition: (position: AttendeeLayoutPrefs['dockPosition']) => void;
  onSetDockViewMode: (mode: AttendeeLayoutPrefs['dockViewMode']) => void;
  className?: string;
}

export function AttendeeDock({
  effectivePrefs,
  participants,
  dominantSpeakerId,
  pinnedParticipantId,
  isWebinar,
  isScreenShareContext,
  onPinToggle,
  onToggleCollapsed,
  onSetStageLayout,
  onSetDockPosition,
  onSetDockViewMode,
  className,
}: AttendeeDockProps) {
  if (effectivePrefs.dockPosition === 'hidden') {
    return (
      <button
        type="button"
        onClick={() => onSetDockPosition('right')}
        className="pointer-events-auto absolute right-3 top-14 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/85 shadow-lg backdrop-blur transition hover:bg-black/75 sm:right-4"
        title="Show attendee dock"
      >
        <PanelRight className="h-3.5 w-3.5" />
        Attendees
      </button>
    );
  }

  const orientation = effectivePrefs.dockPosition === 'top' ? 'horizontal' : 'vertical';

  return (
    <div
      className={cn(
        'pointer-events-auto attendee-dock',
        `attendee-dock--${effectivePrefs.dockPosition}`,
        effectivePrefs.dockCollapsed && 'attendee-dock--collapsed',
        className,
      )}
    >
      <DockToolbar
        dockCollapsed={effectivePrefs.dockCollapsed}
        dockPosition={effectivePrefs.dockPosition}
        dockViewMode={effectivePrefs.dockViewMode}
        stageLayout={effectivePrefs.stageLayout}
        isWebinar={isWebinar}
        isScreenShareContext={isScreenShareContext}
        onToggleCollapsed={onToggleCollapsed}
        onSetStageLayout={onSetStageLayout}
        onSetDockPosition={onSetDockPosition}
        onSetDockViewMode={onSetDockViewMode}
        orientation={orientation}
      />
      {!effectivePrefs.dockCollapsed && (
        <DockThumbnailStrip
          participants={participants}
          dominantSpeakerId={dominantSpeakerId}
          pinnedParticipantId={pinnedParticipantId}
          showName={effectivePrefs.showParticipantNames}
          showSpeakerIndicator={effectivePrefs.showActiveSpeakerIndicator}
          orientation={orientation}
          onPinToggle={onPinToggle}
        />
      )}
    </div>
  );
}
