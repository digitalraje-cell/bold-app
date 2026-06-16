import { joinMeetingAction } from '@/lib/meeting-join-actions';

type JoinMeetingResponse = {
  admitted: boolean;
  meeting: { id: string };
  participant?: { id: string; displayName: string };
};

const GUEST_JOIN_KEY = 'boldmeet-guest-join';

export type GuestJoinSession = {
  meetingId: string;
  participantId: string;
  displayName: string;
};

export function saveGuestJoinSession(session: GuestJoinSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GUEST_JOIN_KEY, JSON.stringify(session));
}

export function readGuestJoinSession(meetingId: string): GuestJoinSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GUEST_JOIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestJoinSession;
    return parsed.meetingId === meetingId ? parsed : null;
  } catch {
    return null;
  }
}

export async function joinMeetingAndGetPath(
  meetingIdOrCode: string,
  displayName: string,
  password?: string,
): Promise<string> {
  console.log('[meeting-join] requesting join via server action', {
    meetingIdOrCode,
    displayName,
    hasPassword: Boolean(password),
  });

  const result = await joinMeetingAction(meetingIdOrCode, displayName, password);

  if (!result.ok) {
    console.error('[meeting-join] join failed', {
      meetingIdOrCode,
      error: result.error,
    });
    throw new Error(result.error);
  }

  console.log('[meeting-join] join success', {
    meetingId: result.meetingId,
    participantId: result.participantId,
    admitted: result.admitted,
    path: result.path,
  });

  if (result.participantId) {
    saveGuestJoinSession({
      meetingId: result.meetingId,
      participantId: result.participantId,
      displayName: result.displayName,
    });
  }

  return result.path;
}

/** @deprecated internal type kept for callers expecting response shape */
export type { JoinMeetingResponse };
