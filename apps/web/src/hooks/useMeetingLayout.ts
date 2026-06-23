'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JitsiRosterParticipant } from '@/hooks/useJitsi';
import {
  DEFAULT_MEETING_LAYOUT_PREFS,
  type MeetingLayoutMode,
  type MeetingLayoutPrefs,
  readMeetingLayoutPrefs,
  writeMeetingLayoutPrefs,
} from '@/lib/meeting-layout-prefs';

type JitsiLayoutApi = {
  setTileView: (enabled: boolean) => void;
  setFilmstripVisible: (visible: boolean) => void;
  pinParticipant: (participantId: string) => void;
  unpinParticipant: () => void;
  pinnedParticipantId: string | null;
  mediaReady: boolean;
};

function applyLayoutToJitsi(api: JitsiLayoutApi, prefs: MeetingLayoutPrefs) {
  if (!api.mediaReady) return;

  const filmstripVisible = prefs.thumbnailPanelMode !== 'hidden';

  switch (prefs.layoutMode) {
    case 'gallery':
      api.setTileView(true);
      api.setFilmstripVisible(filmstripVisible);
      break;
    case 'compact':
      api.setTileView(true);
      api.setFilmstripVisible(false);
      break;
    case 'filmstrip':
      api.setTileView(false);
      api.setFilmstripVisible(filmstripVisible);
      break;
    case 'speaker':
      api.setTileView(false);
      api.setFilmstripVisible(filmstripVisible);
      break;
    case 'pinned':
      api.setTileView(false);
      api.setFilmstripVisible(filmstripVisible);
      if (api.pinnedParticipantId) {
        api.pinParticipant(api.pinnedParticipantId);
      }
      break;
    default:
      break;
  }
}

export function useMeetingLayout(api: JitsiLayoutApi) {
  const [prefs, setPrefs] = useState<MeetingLayoutPrefs>(DEFAULT_MEETING_LAYOUT_PREFS);
  const apiRef = useRef(api);
  apiRef.current = api;

  useEffect(() => {
    setPrefs(readMeetingLayoutPrefs());
  }, []);

  const updatePrefs = useCallback((patch: Partial<MeetingLayoutPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      writeMeetingLayoutPrefs(next);
      return next;
    });
  }, []);

  const setLayoutMode = useCallback((layoutMode: MeetingLayoutMode) => {
    updatePrefs({ layoutMode });
  }, [updatePrefs]);

  useEffect(() => {
    applyLayoutToJitsi(apiRef.current, prefs);
  }, [prefs, api.mediaReady, api.pinnedParticipantId]);

  const dockClassName = useMemo(() => {
    const position = prefs.dockPosition.toLowerCase();
    return `meeting-dock--${position}`;
  }, [prefs.dockPosition]);

  const shellClassName = useMemo(() => {
    if (prefs.thumbnailPanelMode === 'hidden') return 'meeting-jitsi-shell--dock-hidden';
    return `meeting-jitsi-shell--dock-${prefs.dockPosition.toLowerCase()}`;
  }, [prefs.dockPosition, prefs.thumbnailPanelMode]);

  return {
    prefs,
    updatePrefs,
    setLayoutMode,
    dockClassName,
    shellClassName,
  };
}

export function mergeJitsiRoster(
  jitsiParticipants: JitsiRosterParticipant[],
  roomParticipants: Array<{ id: string; displayName: string }>,
): JitsiRosterParticipant[] {
  if (jitsiParticipants.length > 0) return jitsiParticipants;
  return roomParticipants.map((p) => ({
    id: p.id,
    displayName: p.displayName,
  }));
}
