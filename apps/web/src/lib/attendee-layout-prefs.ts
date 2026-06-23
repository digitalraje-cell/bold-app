import {
  DEFAULT_MEETING_LAYOUT_PREFS,
  type MeetingLayoutPrefs,
  readMeetingLayoutPrefs,
} from '@/lib/meeting-layout-prefs';

export type DockPosition = 'right' | 'top' | 'hidden';

export type DockViewMode = 'speaker' | 'participants';

export type StageLayout = 'speaker' | 'grid';

export type SelfViewMode = 'hidden' | 'small' | 'large' | 'floating';

export type SelfViewCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type AttendeeLayoutPrefs = {
  version: 2;
  dockPosition: DockPosition;
  dockCollapsed: boolean;
  dockViewMode: DockViewMode;
  stageLayout: StageLayout;
  selfViewMode: SelfViewMode;
  selfViewCorner: SelfViewCorner;
  selfViewFloating: { x: number; y: number; width: number; height: number };
  showParticipantNames: boolean;
  showActiveSpeakerIndicator: boolean;
  autoHideControls: boolean;
};

const STORAGE_KEY = 'bold:attendee-layout-prefs';

export const DEFAULT_ATTENDEE_LAYOUT_PREFS: AttendeeLayoutPrefs = {
  version: 2,
  dockPosition: 'right',
  dockCollapsed: false,
  dockViewMode: 'participants',
  stageLayout: 'speaker',
  selfViewMode: 'small',
  selfViewCorner: 'bottom-right',
  selfViewFloating: { x: 16, y: 80, width: 140, height: 100 },
  showParticipantNames: true,
  showActiveSpeakerIndicator: true,
  autoHideControls: true,
};

export function migrateMeetingLayoutPrefs(old: MeetingLayoutPrefs): AttendeeLayoutPrefs {
  let dockPosition: DockPosition = 'right';
  if (old.thumbnailPanelMode === 'hidden') {
    dockPosition = 'hidden';
  } else if (old.dockPosition === 'TOP' || old.dockPosition === 'BOTTOM') {
    dockPosition = 'top';
  }

  const stageLayout: StageLayout =
    old.layoutMode === 'gallery' || old.layoutMode === 'compact' ? 'grid' : 'speaker';

  const dockViewMode: DockViewMode =
    old.thumbnailPanelMode === 'single' ? 'speaker' : 'participants';

  return {
    version: 2,
    dockPosition,
    dockCollapsed: old.thumbnailPanelMode === 'minimized',
    dockViewMode,
    stageLayout,
    selfViewMode: 'small',
    selfViewCorner: 'bottom-right',
    selfViewFloating: {
      x: old.floatingDock.x,
      y: old.floatingDock.y,
      width: old.floatingDock.width,
      height: Math.min(old.floatingDock.height, 120),
    },
    showParticipantNames: old.showParticipantNames,
    showActiveSpeakerIndicator: old.showActiveSpeakerIndicator,
    autoHideControls: old.autoHideControls,
  };
}

export function readAttendeeLayoutPrefs(): AttendeeLayoutPrefs {
  if (typeof window === 'undefined') return DEFAULT_ATTENDEE_LAYOUT_PREFS;
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<AttendeeLayoutPrefs>;
      return {
        ...DEFAULT_ATTENDEE_LAYOUT_PREFS,
        ...parsed,
        version: 2,
        selfViewFloating: {
          ...DEFAULT_ATTENDEE_LAYOUT_PREFS.selfViewFloating,
          ...(parsed.selfViewFloating ?? {}),
        },
      };
    }
    const legacy = readMeetingLayoutPrefs();
    const migrated = migrateMeetingLayoutPrefs(legacy);
    writeAttendeeLayoutPrefs(migrated);
    return migrated;
  } catch {
    return DEFAULT_ATTENDEE_LAYOUT_PREFS;
  }
}

export function writeAttendeeLayoutPrefs(prefs: AttendeeLayoutPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, version: 2 }));
}

export function patchAttendeeLayoutPrefs(patch: Partial<AttendeeLayoutPrefs>) {
  const next = { ...readAttendeeLayoutPrefs(), ...patch };
  writeAttendeeLayoutPrefs(next);
  return next;
}

/** Re-export for migration tests */
export { DEFAULT_MEETING_LAYOUT_PREFS };
