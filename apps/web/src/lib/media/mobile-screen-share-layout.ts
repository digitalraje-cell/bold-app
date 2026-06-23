import { RoomMode } from '@boldmeet/shared';

export type MobileScreenShareJitsiApi = {
  mediaReady: boolean;
  setTileView: (enabled: boolean) => void;
  setFilmstripVisible: (visible: boolean) => void;
  setSelfViewHidden: (hidden: boolean) => void;
  overwriteConfig: (config: Record<string, unknown>) => void;
};

export type MobileScreenShareContext = {
  /** Local user is sharing their screen. */
  isScreenSharing: boolean;
  /** Jitsi presenter layout (tile view off) — remote share fallback signal. */
  isPresenterLayout: boolean;
  /** Participant ids currently sharing content (remote). */
  contentSharingParticipantIds: string[];
  roomMode: RoomMode;
};

export function isMobileScreenShareStageActive(context: MobileScreenShareContext): boolean {
  const remoteOrLocalShare =
    context.isScreenSharing || context.contentSharingParticipantIds.length > 0;

  if (remoteOrLocalShare) return true;

  // Webinar stage layout is not screen share — do not collapse the filmstrip.
  if (context.roomMode === RoomMode.WEBINAR) return false;

  // Fallback when Jitsi switches to presenter view for an incoming desktop track.
  return context.isPresenterLayout;
}

export function applyMobileScreenShareLayout(
  api: MobileScreenShareJitsiApi,
  context: MobileScreenShareContext,
) {
  if (!api.mediaReady) return;

  const localSharing = context.isScreenSharing;

  api.overwriteConfig({
    disableStageFilmstrip: true,
    disableTileEnlargement: true,
    // Presenter keeps native floating self-view; viewers hide only their own preview.
    disableSelfView: !localSharing,
    disableSelfViewSettings: true,
    filmstrip: { disableStageFilmstrip: true },
  });

  api.setTileView(false);
  // Visual-only: hide filmstrip tiles; keep full stream subscriptions (no setLastN).
  api.setFilmstripVisible(false);

  if (localSharing) {
    // Ensure sharer PiP stays visible — never hide the presenter's self-view.
    api.setSelfViewHidden(false);
  }
}

export function restoreMobileScreenShareLayout(api: MobileScreenShareJitsiApi) {
  if (!api.mediaReady) return;

  api.overwriteConfig({
    disableStageFilmstrip: false,
    disableTileEnlargement: false,
    disableSelfView: false,
    disableSelfViewSettings: false,
    filmstrip: { disableStageFilmstrip: false },
  });

  api.setTileView(true);
  api.setFilmstripVisible(true);
  api.setSelfViewHidden(true);
}

export function mobileScreenShareShellClass(active: boolean): string {
  return active ? 'meeting-jitsi-shell--mobile-presenting' : '';
}
