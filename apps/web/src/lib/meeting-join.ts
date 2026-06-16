import { normalizeMeetingCode } from '@boldmeet/shared';
import { joinMeetingAction } from '@/lib/meeting-join-actions';

type JoinMeetingResponse = {
  admitted: boolean;
  meeting: { id: string; meetingCode?: string };
  participant?: { id: string; displayName: string };
};

const GUEST_JOIN_KEY = 'boldmeet-guest-join';

export type GuestJoinSession = {
  /** Internal meeting id (API / socket). */
  meetingId: string;
  /** Public route id (numeric meeting code). */
  routeId: string;
  participantId: string;
  displayName: string;
};

function matchesGuestRoute(session: GuestJoinSession, routeParam: string): boolean {
  if (session.meetingId === routeParam || session.routeId === routeParam) return true;
  const normalized = normalizeMeetingCode(routeParam);
  return (
    normalizeMeetingCode(session.routeId) === normalized ||
    normalizeMeetingCode(session.meetingId) === normalized
  );
}

export function saveGuestJoinSession(session: GuestJoinSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GUEST_JOIN_KEY, JSON.stringify(session));
}

export function readGuestJoinSession(routeParam: string): GuestJoinSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GUEST_JOIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestJoinSession>;
    if (!parsed.meetingId || !parsed.participantId || !parsed.displayName) return null;

    const session: GuestJoinSession = {
      meetingId: parsed.meetingId,
      routeId: parsed.routeId ?? parsed.meetingId,
      participantId: parsed.participantId,
      displayName: parsed.displayName,
    };

    return matchesGuestRoute(session, routeParam) ? session : null;
  } catch {
    return null;
  }
}

export async function joinMeetingAndGetPath(
  meetingIdOrCode: string,
  displayName: string,
  options: {
    password?: string;
    viaDirectLink?: boolean;
    participantId?: string;
    registrantEmail?: string;
  } = {},
): Promise<string> {
  console.log('[meeting-join] requesting join via server action', {
    meetingIdOrCode,
    displayName,
    hasPassword: Boolean(options.password),
    viaDirectLink: options.viaDirectLink,
  });

  const result = await joinMeetingAction(meetingIdOrCode, displayName, options);

  if (!result.ok) {
    console.error('[meeting-join] join failed', {
      meetingIdOrCode,
      error: result.error,
    });
    throw new Error(result.error);
  }

  console.log('[meeting-join] join success', {
    meetingId: result.meetingId,
    routeId: result.routeId,
    participantId: result.participantId,
    admitted: result.admitted,
    path: result.path,
  });

  if (result.participantId) {
    saveGuestJoinSession({
      meetingId: result.meetingId,
      routeId: result.routeId,
      participantId: result.participantId,
      displayName: result.displayName,
    });
  }

  return result.path;
}

/** @deprecated internal type kept for callers expecting response shape */
export type { JoinMeetingResponse };
