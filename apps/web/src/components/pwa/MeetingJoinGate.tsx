'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Globe, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { savePendingJoin, clearPendingJoin } from '@/lib/pwa-pending-join';
import { IosInstallGuide } from '@/components/pwa/IosInstallGuide';
import { AndroidInstallGuide } from '@/components/pwa/AndroidInstallGuide';
import { MeetingInvitationChrome } from '@/components/meeting/MeetingInvitationChrome';
import type { PublicMeetingPreview } from '@/components/meeting/MeetingLobby';

export function MeetingJoinGate({
  meetingId,
  initialPreview,
  initialPreviewError,
}: {
  meetingId: string;
  initialPreview: PublicMeetingPreview | null;
  initialPreviewError: string | null;
}) {
  const router = useRouter();
  const {
    isInstalled,
    ready,
    continueLabel,
    isIos,
    isAndroid,
    canNativeInstall,
    promptInstall,
    trackPwaEvent,
  } = usePwaInstall();
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const title = initialPreview?.title ?? 'Join meeting';
  const hostName = initialPreview?.hostName ?? 'your host';
  const previewUnavailable = Boolean(initialPreviewError);
  const canContinue = !previewUnavailable;

  function handleJoinMeeting() {
    if (!canContinue) return;
    clearPendingJoin();
    void trackPwaEvent('BROWSER_JOIN_SELECTED', {
      meetingId: initialPreview?.id,
      meetingCode: meetingId,
    });
    router.push(`/meeting/${meetingId}`);
  }

  async function handleDownload() {
    if (!canContinue) return;
    savePendingJoin(meetingId);
    const result = await promptInstall();
    if (result.mode === 'manual' || isIos || isAndroid) {
      setShowInstallHelp(true);
    }
    if (result.accepted) {
      clearPendingJoin();
      router.push(`/meeting/${meetingId}`);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <div className={cn(cardClass(), 'w-full max-w-lg p-8 sm:p-10')}>
        <MeetingInvitationChrome preview={initialPreview} className="mb-6" />

        <p className={ui.eyebrow}>Join meeting</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hosted by {hostName}
          {initialPreview?.status === 'LIVE' ? ' · Live now' : ''}
        </p>

        {initialPreviewError && (
          <p className="mt-4 rounded-[var(--radius-md)] border border-border bg-[var(--badge-bg)] px-4 py-3 text-sm text-muted-foreground">
            {initialPreviewError}
          </p>
        )}

        <div className="mt-8 space-y-3">
          {isInstalled ? (
            <Button size="lg" className="w-full" disabled={!canContinue} onClick={handleJoinMeeting}>
              <Video className="h-5 w-5" />
              Join Meeting
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full"
                disabled={!canContinue}
                onClick={() => void handleDownload()}
              >
                <Download className="h-5 w-5" />
                Install Bold App
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                disabled={!canContinue}
                onClick={handleJoinMeeting}
              >
                <Globe className="h-5 w-5" />
                {continueLabel}
              </Button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/join" className="text-foreground underline-offset-4 hover:underline">
            Back to join page
          </Link>
        </p>

        {showInstallHelp && isIos && <IosInstallGuide />}
        {showInstallHelp && isAndroid && (
          <AndroidInstallGuide hasNativePrompt={canNativeInstall} />
        )}
        {showInstallHelp && !isIos && !isAndroid && (
          <p className="mt-4 text-sm text-muted-foreground">
            For the best install experience, use Chrome or Edge, then choose Install from the menu.
          </p>
        )}

        {!isInstalled && !showInstallHelp && !canNativeInstall && !isIos && !isAndroid && (
          <p className="mt-4 text-sm text-muted-foreground">
            For the best install experience, use Chrome or Edge, then choose Install from the menu.
          </p>
        )}
      </div>
    </div>
  );
}
