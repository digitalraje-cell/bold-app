import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { normalizeMeetingCode } from '@boldmeet/shared';
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
    if (
      initialPreview &&
      normalizeMeetingCode(meetingId) !== initialPreview.meetingCode &&
      meetingId === initialPreview.id
    ) {
      redirect(`/meeting/${initialPreview.meetingCode}`);
    }
  } catch (error) {
    initialPreviewError =
      error instanceof Error ? error.message : 'Meeting not found or no longer available';
  }

  return (
    <Suspense fallback={<div className="flex min-h-full items-center justify-center">Loading…</div>}>
      <MeetingLobby
        meetingId={meetingId}
        initialPreview={initialPreview}
        initialPreviewError={initialPreviewError}
      />
    </Suspense>
  );
}
