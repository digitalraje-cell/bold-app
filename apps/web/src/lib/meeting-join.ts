import { api } from '@/lib/api';

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
  const payload: { displayName: string; password?: string } = {
    displayName,
  };
  if (password) {
    payload.password = password;
  }

  console.log('[meeting-join] requesting join', {
    meetingIdOrCode,
    displayName,
    hasPassword: Boolean(password),
  });

  const result = (await api.meetings.join(meetingIdOrCode, payload)) as JoinMeetingResponse;

  console.log('[meeting-join] join success', {
    meetingId: result.meeting?.id,
    participantId: result.participant?.id,
    admitted: result.admitted,
  });

  const meetingId = result.meeting?.id ?? meetingIdOrCode;

  if (result.participant) {
    saveGuestJoinSession({
      meetingId,
      participantId: result.participant.id,
      displayName: result.participant.displayName || displayName,
    });
  }

  return result.admitted
    ? `/meeting/${meetingId}/room`
    : `/meeting/${meetingId}/waiting`;
}
