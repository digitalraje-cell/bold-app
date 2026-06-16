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

export function readJoinMediaPrefs(): JoinMediaPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = sessionStorage.getItem(JOIN_MEDIA_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<JoinMediaPrefs>;
    return {
      startWithAudio: parsed.startWithAudio ?? DEFAULT_PREFS.startWithAudio,
      startWithVideo: parsed.startWithVideo ?? DEFAULT_PREFS.startWithVideo,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
