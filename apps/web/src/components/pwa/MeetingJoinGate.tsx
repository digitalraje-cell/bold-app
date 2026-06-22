'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';
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
  const { isInstalled, continueLabel, isIos, canNativeInstall, promptInstall, trackPwaEvent } =
    usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      router.replace(`/meeting/${meetingId}`);
    }
  }, [isInstalled, meetingId, router]);

  if (isInstalled) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Opening meeting…
      </div>
    );
  }

  const title = initialPreview?.title ?? 'Join meeting';
  const hostName = initialPreview?.hostName ?? 'your host';

  async function handleDownload() {
    const result = await promptInstall();
    if (result.mode === 'manual' || isIos) {
      setShowIosHelp(true);
    }
    if (result.accepted) {
      router.push(`/meeting/${meetingId}`);
    }
  }

  function handleContinueInBrowser() {
    void trackPwaEvent('BROWSER_JOIN_SELECTED', {
      meetingId: initialPreview?.id,
      meetingCode: meetingId,
    });
    router.push(`/meeting/${meetingId}`);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <div className={cn(cardClass(), 'w-full max-w-lg p-8 sm:p-10')}>
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
          <Button size="lg" className="w-full" onClick={() => void handleDownload()}>
            <Download className="h-5 w-5" />
            Download Bold App
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={handleContinueInBrowser}>
            <Globe className="h-5 w-5" />
            {continueLabel}
          </Button>
        </div>

        {showIosHelp && (
          <p className="mt-4 text-sm text-muted-foreground">
            To install on {isIos ? 'iOS' : 'this device'}: open the browser menu and choose{' '}
            <strong>Add to Home Screen</strong> or <strong>Install app</strong>.
          </p>
        )}

        {!canNativeInstall && !isIos && !showIosHelp && (
          <p className="mt-4 text-sm text-muted-foreground">
            For the best install experience, use Chrome or Edge, then choose Install from the menu.
          </p>
        )}
      </div>
    </div>
  );
}
