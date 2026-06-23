const PENDING_JOIN_KEY = 'bold-pwa-pending-join';
const PENDING_JOIN_MAX_AGE_MS = 30 * 60 * 1000;

type PendingJoinRecord = {
  code: string;
  savedAt: number;
};

function readRawPendingJoin(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_JOIN_KEY) || localStorage.getItem(PENDING_JOIN_KEY);
}

export function savePendingJoin(meetingCode: string) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({ code: meetingCode, savedAt: Date.now() } satisfies PendingJoinRecord);
  sessionStorage.setItem(PENDING_JOIN_KEY, payload);
  localStorage.setItem(PENDING_JOIN_KEY, payload);
}

export function readPendingJoin(): string | null {
  const raw = readRawPendingJoin();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingJoinRecord;
    if (!parsed.code || typeof parsed.savedAt !== 'number') {
      clearPendingJoin();
      return null;
    }
    if (Date.now() - parsed.savedAt > PENDING_JOIN_MAX_AGE_MS) {
      clearPendingJoin();
      return null;
    }
    return parsed.code;
  } catch {
    // Legacy plain meeting code string
    if (/^[a-zA-Z0-9-]+$/.test(raw)) {
      return raw;
    }
    clearPendingJoin();
    return null;
  }
}

export function clearPendingJoin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_JOIN_KEY);
  localStorage.removeItem(PENDING_JOIN_KEY);
}
