import { fetchPublicMeetingServer } from '@/lib/api-server';
import { MeetingLobby } from '@/components/meeting/MeetingLobby';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MeetingLobbyPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  let initialPreview = null;
  let initialPreviewError: string | null = null;

  try {
    initialPreview = await fetchPublicMeetingServer(meetingId);
  } catch (error) {
    initialPreviewError =
      error instanceof Error ? error.message : 'Meeting not found or no longer available';
  }

  return (
    <MeetingLobby
      meetingId={meetingId}
      initialPreview={initialPreview}
      initialPreviewError={initialPreviewError}
    />
  );
}
