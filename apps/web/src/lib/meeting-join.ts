import { api } from '@/lib/api';

type JoinMeetingResponse = {
  admitted: boolean;
  meeting: { id: string };
};

export async function joinMeetingAndGetPath(
  meetingIdOrCode: string,
  displayName: string,
  password?: string,
): Promise<string> {
  const result = (await api.meetings.join(meetingIdOrCode, {
    displayName,
    password,
  })) as JoinMeetingResponse;

  const meetingId = result.meeting?.id ?? meetingIdOrCode;
  return result.admitted
    ? `/meeting/${meetingId}/room`
    : `/meeting/${meetingId}/waiting`;
}
