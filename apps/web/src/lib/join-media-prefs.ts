import type { MeetingPrefSettings } from './user-settings';
import { readUserSettings } from './user-settings';

const JOIN_MEDIA_PREFS_KEY = 'boldmeet-join-media';

export type JoinMediaPrefs = {
  startWithAudio: boolean;
  startWithVideo: boolean;
};

const DEFAULT_PREFS: JoinMediaPrefs = {
  startWithAudio: true,
  startWithVideo: true,
};

export function saveJoinMediaPrefs(prefs: JoinMediaPrefs): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(JOIN_MEDIA_PREFS_KEY, JSON.stringify(prefs));
}

export function readJoinMediaPrefs(overrides?: Partial<MeetingPrefSettings>): JoinMediaPrefs {
  const fromSettings = typeof window !== 'undefined' ? readUserSettings().meeting : null;

  const startWithAudio = overrides?.joinWithMic ?? fromSettings?.joinWithMic ?? DEFAULT_PREFS.startWithAudio;
  const startWithVideo =
    overrides?.joinWithCamera ?? fromSettings?.joinWithCamera ?? DEFAULT_PREFS.startWithVideo;

  if (typeof window === 'undefined') {
    return { startWithAudio, startWithVideo };
  }

  try {
    const raw = sessionStorage.getItem(JOIN_MEDIA_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<JoinMediaPrefs>;
      return {
        startWithAudio: parsed.startWithAudio ?? startWithAudio,
        startWithVideo: parsed.startWithVideo ?? startWithVideo,
      };
    }
  } catch {
    // fall through
  }

  return { startWithAudio, startWithVideo };
}
