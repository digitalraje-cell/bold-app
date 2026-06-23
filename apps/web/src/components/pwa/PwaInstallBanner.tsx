'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { IosInstallGuide } from '@/components/pwa/IosInstallGuide';
import { AndroidInstallGuide } from '@/components/pwa/AndroidInstallGuide';

const DISMISS_KEY = 'bold-pwa-banner-dismissed';

export function PwaInstallBanner() {
  const { isInstalled, isIos, isAndroid, canNativeInstall, promptInstall, ready } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (!hydrated || !ready) {
    return null;
  }

  if (isInstalled || dismissed) {
    return null;
  }

  async function handleInstall() {
    const result = await promptInstall();
    if (result.mode === 'manual' || isIos || isAndroid) {
      setShowInstallHelp(true);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        cardClass({ bordered: true }),
        'sticky top-0 z-20 mb-8 flex flex-col gap-4 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="flex items-start gap-3">
        <BoldLogo size={40} />
        <div>
          <p className="font-semibold">Install Bold App for faster meetings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch meetings instantly from your home screen — no browser tabs required.
          </p>
          {showInstallHelp && isIos && <IosInstallGuide />}
          {showInstallHelp && isAndroid && (
            <AndroidInstallGuide hasNativePrompt={canNativeInstall} />
          )}
          {showInstallHelp && !isIos && !isAndroid && (
            <p className="mt-2 text-sm text-muted-foreground">
              Use Chrome or Edge menu → <strong>Install app</strong>.
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => void handleInstall()}>
          <Download className="h-4 w-4" />
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
