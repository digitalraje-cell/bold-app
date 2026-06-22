const PENDING_JOIN_KEY = 'bold-pwa-pending-join';

export function savePendingJoin(meetingCode: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_JOIN_KEY, meetingCode);
  localStorage.setItem(PENDING_JOIN_KEY, meetingCode);
}

export function readPendingJoin(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_JOIN_KEY) || localStorage.getItem(PENDING_JOIN_KEY);
}

export function clearPendingJoin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_JOIN_KEY);
  localStorage.removeItem(PENDING_JOIN_KEY);
}
