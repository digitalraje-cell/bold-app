const STORAGE_KEY = 'boldmeet-user-settings';

export type MeetingPrefSettings = {
  joinWithMic: boolean;
  joinWithCamera: boolean;
  enableNotifications: boolean;
  darkMode: boolean;
};

export type HostDefaultSettings = {
  allowGuestAttendees: boolean;
  requireMeetingPasscode: boolean;
  waitingRoomEnabled: boolean;
  allowAttendeeScreenShare: boolean;
};

export type UserSettings = {
  meeting: MeetingPrefSettings;
  host: HostDefaultSettings;
};

const DEFAULT_MEETING_PREFS: MeetingPrefSettings = {
  joinWithMic: true,
  joinWithCamera: true,
  enableNotifications: false,
  darkMode: false,
};

const DEFAULT_HOST_SETTINGS: HostDefaultSettings = {
  allowGuestAttendees: true,
  requireMeetingPasscode: false,
  waitingRoomEnabled: false,
  allowAttendeeScreenShare: true,
};

const DEFAULT_SETTINGS: UserSettings = {
  meeting: DEFAULT_MEETING_PREFS,
  host: DEFAULT_HOST_SETTINGS,
};

function readRaw(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      meeting: { ...DEFAULT_MEETING_PREFS, ...parsed.meeting },
      host: { ...DEFAULT_HOST_SETTINGS, ...parsed.host },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function readUserSettings(): UserSettings {
  return readRaw();
}

export function saveUserSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function saveMeetingPrefs(prefs: Partial<MeetingPrefSettings>): MeetingPrefSettings {
  const current = readRaw();
  const meeting = { ...current.meeting, ...prefs };
  saveUserSettings({ ...current, meeting });
  applyDarkMode(meeting.darkMode);
  return meeting;
}

export function saveHostDefaults(host: Partial<HostDefaultSettings>): HostDefaultSettings {
  const current = readRaw();
  const next = { ...current.host, ...host };
  saveUserSettings({ ...current, host: next });
  return next;
}

export function applyDarkMode(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', enabled);
  document.documentElement.classList.toggle('light', !enabled);
}

export function initUserSettingsTheme(): void {
  const { darkMode } = readRaw().meeting;
  applyDarkMode(darkMode);
}

export function hostDefaultsToMeetingSettings(host: HostDefaultSettings) {
  return {
    waitingRoomEnabled: host.waitingRoomEnabled,
    registrationRequired: !host.allowGuestAttendees,
    screenShareEnabled: true,
    screenShareHostOnly: !host.allowAttendeeScreenShare,
  };
}

export { DEFAULT_MEETING_PREFS, DEFAULT_HOST_SETTINGS };
