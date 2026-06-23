'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { Button } from '@/components/ui/Button';

export default function RecordingsPage() {
  const { can, shouldShowUpgrade } = usePermissions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const canRecord = can('canRecord');

  return (
    <div className="mx-auto max-w-4xl">
      {shouldShowUpgrade && (
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          feature="Meeting recordings"
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage recordings from your Pro meetings.
        </p>
      </div>

      {!canRecord && shouldShowUpgrade && <UpgradeBanner />}

      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Film className="h-7 w-7 text-muted-foreground" />
        </div>
        {canRecord ? (
          <>
            <h2 className="text-lg font-semibold">No recordings yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Recordings from your meetings will appear here when cloud recording is available.
            </p>
            <Link href="/meetings/create?type=instant" className="mt-6 inline-block">
              <Button>Start a meeting</Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Recordings are a Pro feature</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Upgrade to Pro for webinar hosting, co-hosts, and cloud recording when it launches.
            </p>
            {shouldShowUpgrade && (
              <Button className="mt-6" onClick={() => setUpgradeOpen(true)}>
                Upgrade to Pro
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
