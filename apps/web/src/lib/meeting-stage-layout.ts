import { RoomMode } from '@boldmeet/shared';

export type MeetingStageJitsiApi = {
  setTileView: (enabled: boolean) => void;
  setFilmstripVisible: (visible: boolean) => void;
  setSelfViewHidden: (hidden: boolean) => void;
  runJitsiCommand?: (command: string, ...args: unknown[]) => void;
  mediaReady: boolean;
};

export type MeetingStageContext = {
  isScreenSharing: boolean;
  isPresenterLayout: boolean;
  roomMode: RoomMode;
  /** Host is relaying the meeting tab to YouTube — keep tiles visible for capture + monitoring. */
  isYoutubeLiveCapturing?: boolean;
};

/**
 * Bold V1: one automatic layout. No user-facing view modes.
 * Jitsi owns all participant video — no Bold overlay strip.
 */
export function applyAutoStageLayout(
  api: MeetingStageJitsiApi,
  context: MeetingStageContext,
) {
  if (!api.mediaReady) return;

  const screenShareActive = context.isScreenSharing;
  const webinar = context.roomMode === RoomMode.WEBINAR;

  api.runJitsiCommand?.('overwriteConfig', {
    disableStageFilmstrip: true,
    disableShowVideoMutedAvatar: true,
    disableTileEnlargement: screenShareActive,
  });

  if (context.isYoutubeLiveCapturing && !screenShareActive) {
    api.setTileView(true);
    api.setFilmstripVisible(true);
    api.setSelfViewHidden(false);
    return;
  }

  if (screenShareActive) {
    api.setTileView(false);
    api.setFilmstripVisible(true);
    api.setSelfViewHidden(true);
    return;
  }

  if (webinar) {
    api.setTileView(false);
    api.setFilmstripVisible(true);
    api.setSelfViewHidden(true);
    return;
  }

  // Normal meeting: Jitsi default layout; suppress duplicate self-view and avatar initials.
  api.setSelfViewHidden(true);
  api.setFilmstripVisible(true);
}

export function meetingStageShellClass(context: MeetingStageContext): string {
  const classes = ['meeting-jitsi-shell', 'meeting-jitsi-shell--auto'];
  if (context.isScreenSharing) {
    classes.push('meeting-jitsi-shell--presenting');
  }
  if (context.roomMode === RoomMode.WEBINAR) {
    classes.push('meeting-jitsi-shell--webinar');
  }
  return classes.join(' ');
}
