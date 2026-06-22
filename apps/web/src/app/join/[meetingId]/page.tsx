import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { normalizeMeetingCode } from '@boldmeet/shared';
import { fetchPublicMeetingServer } from '@/lib/api-server';
import { MeetingJoinGate } from '@/components/pwa/MeetingJoinGate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function JoinMeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const normalizedCode = normalizeMeetingCode(meetingId);

  let initialPreview = null;
  let initialPreviewError: string | null = null;

  try {
    initialPreview = await fetchPublicMeetingServer(meetingId);
    if (
      initialPreview &&
      normalizedCode !== initialPreview.meetingCode &&
      meetingId === initialPreview.id
    ) {
      redirect(`/join/${initialPreview.meetingCode}`);
    }
  } catch (error) {
    initialPreviewError =
      error instanceof Error ? error.message : 'Meeting not found or no longer available';
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <MeetingJoinGate
        meetingId={normalizedCode}
        initialPreview={initialPreview}
        initialPreviewError={initialPreviewError}
      />
    </Suspense>
  );
}
