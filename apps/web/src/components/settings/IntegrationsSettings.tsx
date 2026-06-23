'use client';

import { useCallback, useEffect, useState } from 'react';
import { isMaxPlanComingSoon, MAX_PLAN_DISPLAY } from '@boldmeet/shared';
import { MaxWaitlistForm } from '@/components/billing/MaxWaitlistForm';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { api } from '@/lib/api';
import { badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type IntegrationSection = {
  provider: string;
  name: string;
  shortName: string;
  status: 'active' | 'coming_soon';
  roadmapDescription: string;
  connectable: boolean;
  accounts: Array<{
    id: string;
    accountName: string;
    accountAvatar?: string | null;
    accountEmail?: string | null;
    status: string;
    connectedAt: string;
  }>;
};

export function IntegrationsSettings() {
  const [sections, setSections] = useState<IntegrationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = (await api.integrations.overview().catch(() => ({ sections: [] }))) as {
        sections: IntegrationSection[];
      };
      setSections(overview.sections ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load integrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function renderComingSoonSection(section: IntegrationSection) {
    const isYouTube = section.provider === 'youtube';
    return (
      <SettingsCard
        key={section.provider}
        title={section.name}
        description={isYouTube ? 'Coming Soon – Available in Phase 2' : section.roadmapDescription}
        footer={
          <span className={cn(badgeClass(), 'text-[10px] uppercase tracking-wide')}>
            {isYouTube ? 'Coming Soon – Available in Phase 2' : 'Coming Soon'}
          </span>
        }
      >
        <p className="text-sm text-muted-foreground">
          {isYouTube
            ? 'YouTube integration is planned for Phase 2. Core meetings, webinars, and screen sharing are available today.'
            : 'Launching with Bold Max. Join the waitlist to get early access and help us prioritize this integration.'}
        </p>
      </SettingsCard>
    );
  }

  return (
    <SettingsShell
      title="Integrations"
      description="Manage platform connections as integrations roll out in future release phases."
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      ) : (
        <div className="space-y-6">
          {sections.map(renderComingSoonSection)}

          {isMaxPlanComingSoon() && (
            <SettingsCard
              title="Max — Launching Soon"
              description={MAX_PLAN_DISPLAY.foundingOffer}
            >
              <MaxWaitlistForm />
            </SettingsCard>
          )}
        </div>
      )}
    </SettingsShell>
  );
}
