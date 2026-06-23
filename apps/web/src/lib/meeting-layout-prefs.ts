export type MeetingLayoutMode =
  | 'filmstrip'
  | 'gallery'
  | 'speaker'
  | 'pinned'
  | 'compact';

export type ParticipantDockPosition = 'RIGHT' | 'TOP' | 'BOTTOM' | 'LEFT' | 'FLOATING';

export type ThumbnailPanelMode = 'open_all' | 'minimized' | 'single' | 'hidden';

export type ThumbnailSize = 'small' | 'medium' | 'large';

export type MeetingLayoutPrefs = {
  layoutMode: MeetingLayoutMode;
  dockPosition: ParticipantDockPosition;
  thumbnailPanelMode: ThumbnailPanelMode;
  autoHideControls: boolean;
  showParticipantNames: boolean;
  showActiveSpeakerIndicator: boolean;
  thumbnailSize: ThumbnailSize;
  floatingDock: { x: number; y: number; width: number; height: number; collapsed: boolean };
};

const STORAGE_KEY = 'bold:meeting-layout-prefs';

export const DEFAULT_MEETING_LAYOUT_PREFS: MeetingLayoutPrefs = {
  layoutMode: 'speaker',
  dockPosition: 'RIGHT',
  thumbnailPanelMode: 'open_all',
  autoHideControls: true,
  showParticipantNames: true,
  showActiveSpeakerIndicator: true,
  thumbnailSize: 'medium',
  floatingDock: { x: 24, y: 96, width: 168, height: 320, collapsed: false },
};

export function readMeetingLayoutPrefs(): MeetingLayoutPrefs {
  if (typeof window === 'undefined') return DEFAULT_MEETING_LAYOUT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MEETING_LAYOUT_PREFS;
    const parsed = JSON.parse(raw) as Partial<MeetingLayoutPrefs>;
    return {
      ...DEFAULT_MEETING_LAYOUT_PREFS,
      ...parsed,
      floatingDock: {
        ...DEFAULT_MEETING_LAYOUT_PREFS.floatingDock,
        ...(parsed.floatingDock ?? {}),
      },
    };
  } catch {
    return DEFAULT_MEETING_LAYOUT_PREFS;
  }
}

export function writeMeetingLayoutPrefs(prefs: MeetingLayoutPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function patchMeetingLayoutPrefs(patch: Partial<MeetingLayoutPrefs>) {
  const next = { ...readMeetingLayoutPrefs(), ...patch };
  writeMeetingLayoutPrefs(next);
  return next;
}

export const THUMBNAIL_SIZE_PX: Record<ThumbnailSize, number> = {
  small: 64,
  medium: 88,
  large: 112,
};
