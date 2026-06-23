import type { AttendeeLayoutPrefs } from '@/lib/attendee-layout-prefs';

export type AttendeeJitsiLayoutApi = {
  setTileView: (enabled: boolean) => void;
  setFilmstripVisible: (visible: boolean) => void;
  pinParticipant: (participantId: string) => void;
  unpinParticipant: () => void;
  pinnedParticipantId: string | null;
  setSelfViewHidden: (hidden: boolean) => void;
  mediaReady: boolean;
};

/** Bold dock owns the filmstrip — Jitsi native strip stays off when dock is shown. */
export function applyAttendeeLayoutToJitsi(
  api: AttendeeJitsiLayoutApi,
  prefs: AttendeeLayoutPrefs,
) {
  if (!api.mediaReady) return;

  const dockVisible = prefs.dockPosition !== 'hidden' && !prefs.dockCollapsed;

  if (prefs.stageLayout === 'grid') {
    api.setTileView(true);
  } else {
    api.setTileView(false);
    if (api.pinnedParticipantId) {
      api.pinParticipant(api.pinnedParticipantId);
    }
  }

  api.setFilmstripVisible(false);

  if (prefs.selfViewMode === 'hidden' || prefs.selfViewMode === 'floating') {
    api.setSelfViewHidden(true);
  } else {
    api.setSelfViewHidden(false);
  }

  void dockVisible;
}
