import { redirect } from 'next/navigation';
import { normalizeMeetingCode } from '@boldmeet/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function JoinMeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  redirect(`/meeting/${normalizeMeetingCode(meetingId)}`);
}
