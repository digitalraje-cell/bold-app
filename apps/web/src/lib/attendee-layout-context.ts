import { RoomMode } from '@boldmeet/shared';
import type { AttendeeLayoutPrefs, DockPosition } from '@/lib/attendee-layout-prefs';

export type LayoutContext = {
  isScreenSharing: boolean;
  isPresenterLayout: boolean;
  roomMode: RoomMode;
};

/**
 * Contextual layout hints — does not persist; user's saved prefs remain unchanged.
 */
export function resolveEffectiveLayout(
  prefs: AttendeeLayoutPrefs,
  ctx: LayoutContext,
): AttendeeLayoutPrefs {
  let dockPosition: DockPosition = prefs.dockPosition;

  if (ctx.isScreenSharing || ctx.isPresenterLayout) {
    dockPosition = prefs.dockPosition === 'hidden' ? 'hidden' : 'top';
  }

  if (ctx.roomMode === RoomMode.WEBINAR) {
    return {
      ...prefs,
      dockPosition,
      stageLayout: 'speaker',
      dockViewMode: 'participants',
    };
  }

  if (ctx.isScreenSharing || ctx.isPresenterLayout) {
    return {
      ...prefs,
      dockPosition,
      stageLayout: 'speaker',
      dockViewMode: 'participants',
    };
  }

  return { ...prefs, dockPosition };
}

export function attendeeShellClassName(prefs: AttendeeLayoutPrefs): string {
  if (prefs.dockPosition === 'hidden') {
    return 'meeting-jitsi-shell--attendee-dock-hidden';
  }
  if (prefs.dockPosition === 'top') {
    return prefs.dockCollapsed
      ? 'meeting-jitsi-shell--attendee-dock-top-collapsed'
      : 'meeting-jitsi-shell--attendee-dock-top';
  }
  return prefs.dockCollapsed
    ? 'meeting-jitsi-shell--attendee-dock-right-collapsed'
    : 'meeting-jitsi-shell--attendee-dock-right';
}
