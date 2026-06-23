'use client';

import { useMemo } from 'react';
import { RoomMode } from '@boldmeet/shared';
import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import type { RoomParticipant } from '@/stores/roomStore';
import type { DockViewMode } from '@/lib/attendee-layout-prefs';

const STAGE_ROLES = new Set(['HOST', 'CO_HOST', 'PANELIST']);

function isOnStageParticipant(
  jitsiId: string,
  roomByJitsiId: Map<string, RoomParticipant>,
  roomByDisplayName: Map<string, RoomParticipant>,
  participant: JitsiRosterParticipant,
): boolean {
  const room =
    roomByJitsiId.get(jitsiId) ??
    roomByDisplayName.get(participant.displayName.trim().toLowerCase());
  if (!room) return false;
  if (STAGE_ROLES.has(room.role)) return true;
  return room.isOnStage;
}

export function useDockRoster(input: {
  jitsiParticipants: JitsiRosterParticipant[];
  roomParticipants: RoomParticipant[];
  roomMode: RoomMode;
  dockViewMode: DockViewMode;
  dominantSpeakerId: string | null;
  pinnedParticipantId: string | null;
  localParticipantId: string | null;
}) {
  return useMemo(() => {
    const roomByJitsiId = new Map(input.roomParticipants.map((p) => [p.id, p]));
    const roomByDisplayName = new Map(
      input.roomParticipants.map((p) => [p.displayName.trim().toLowerCase(), p]),
    );

    let roster = [...input.jitsiParticipants];

    if (input.roomMode === RoomMode.WEBINAR) {
      const audience = roster.filter(
        (p) =>
          !isOnStageParticipant(p.id, roomByJitsiId, roomByDisplayName, p) &&
          p.id !== input.localParticipantId,
      );
      const stage = roster.filter((p) =>
        isOnStageParticipant(p.id, roomByJitsiId, roomByDisplayName, p),
      );
      roster = audience.length > 0 ? audience : stage;
    }

    if (input.dockViewMode === 'speaker') {
      const targetId =
        input.pinnedParticipantId ??
        input.dominantSpeakerId ??
        roster[0]?.id ??
        input.jitsiParticipants[0]?.id;
      const match = roster.find((p) => p.id === targetId);
      return match ? [match] : roster.slice(0, 1);
    }

    return roster;
  }, [
    input.jitsiParticipants,
    input.roomParticipants,
    input.roomMode,
    input.dockViewMode,
    input.dominantSpeakerId,
    input.pinnedParticipantId,
    input.localParticipantId,
  ]);
}
