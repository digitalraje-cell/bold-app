'use client';

import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const DISMISS_KEY = 'bold-pwa-banner-dismissed';

export function PwaInstallBanner() {
  const { isInstalled, isIos, canNativeInstall, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  });
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isInstalled || dismissed) return null;

  async function handleInstall() {
    const result = await promptInstall();
    if (result.mode === 'manual' || isIos) {
      setShowIosHelp(true);
    }
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className={cn(cardClass({ bordered: true }), 'mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between')}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--badge-bg)]">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Install Bold App for faster meetings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch meetings instantly from your home screen — no browser tabs required.
          </p>
          {showIosHelp && (
            <p className="mt-2 text-sm text-muted-foreground">
              On iPhone/iPad: tap Share → <strong>Add to Home Screen</strong>.
            </p>
          )}
          {!canNativeInstall && !isIos && !showIosHelp && (
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
