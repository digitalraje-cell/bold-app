'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  YOUTUBE_LIVE_ACTIVATION_MESSAGE,
  YOUTUBE_LIVE_LEARN_MORE_URL,
  isMaxPlanComingSoon,
  MAX_PLAN_DISPLAY,
  type YouTubeChannelAccount,
  type YouTubeConnectionStatus,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { MaxWaitlistForm } from '@/components/billing/MaxWaitlistForm';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { usePermissions } from '@/hooks/usePermissions';
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
  const { can, shouldShowUpgrade } = usePermissions();
  const canStream = can('canStreamToYoutube');

  const [sections, setSections] = useState<IntegrationSection[]>([]);
  const [youtubeConnection, setYoutubeConnection] = useState<YouTubeConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshYoutube = false) => {
    setLoading(true);
    setError(null);
    try {
      const [overview, youtubeStatus] = await Promise.all([
        api.integrations.overview().catch(() => ({ sections: [] })),
        canStream
          ? (api.youtube.status(refreshYoutube) as Promise<YouTubeConnectionStatus>)
          : Promise.resolve(null),
      ]);
      setSections((overview as { sections: IntegrationSection[] }).sections ?? []);
      setYoutubeConnection(youtubeStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load integrations.');
    } finally {
      setLoading(false);
    }
  }, [canStream]);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const youtube = params.get('youtube');
    if (!youtube) return;
    params.delete('youtube');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', next);
    if (youtube === 'connected') {
      setMessage('YouTube channel connected successfully.');
      void load(true);
    } else if (youtube === 'error') {
      setError('Could not connect YouTube channel.');
    }
  }, [load]);

  const youtubeAccounts = youtubeConnection?.accounts ?? [];
  const limits = youtubeConnection?.limits;
  const canAddYoutube = limits?.canAddChannel ?? false;

  async function handleAddYoutube() {
    setConnecting(true);
    setError(null);
    try {
      const result = (await api.youtube.connectUrl('/settings/integrations')) as { url: string };
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in');
      setConnecting(false);
    }
  }

  async function handleRefreshEligibility(accountId: string) {
    setRefreshingId(accountId);
    try {
      const status = (await api.youtube.refreshEligibility(accountId)) as YouTubeConnectionStatus;
      setYoutubeConnection(status);
      setMessage('Channel status updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh channel status');
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    setDisconnectingId(accountId);
    try {
      await api.youtube.disconnectAccount(accountId);
      setMessage('Channel disconnected.');
      await load(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect channel');
    } finally {
      setDisconnectingId(null);
    }
  }

  function renderYoutubeAccount(account: YouTubeChannelAccount) {
    const liveEnabled = account.status === 'live_enabled' || account.liveStreamingEnabled;
    return (
      <li
        key={account.id}
        className="flex flex-col gap-3 border-b border-border/50 py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex gap-3">
          {account.channelAvatar ? (
            <img src={account.channelAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {account.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium">{account.name}</p>
            {account.gmailAccount && (
              <p className="text-sm text-muted-foreground">{account.gmailAccount}</p>
            )}
            <span
              className={cn(
                'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                liveEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900',
              )}
            >
              {liveEnabled ? 'Live enabled' : 'Activation required'}
            </span>
            {!liveEnabled && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {YOUTUBE_LIVE_ACTIVATION_MESSAGE}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!liveEnabled && (
            <>
              <a
                href={account.activationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
              >
                Enable Live Streaming
              </a>
              <Button
                size="sm"
                variant="secondary"
                loading={refreshingId === account.id}
                onClick={() => void handleRefreshEligibility(account.id)}
              >
                Check again
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            loading={disconnectingId === account.id}
            onClick={() => void handleDisconnect(account.id)}
          >
            Remove
          </Button>
        </div>
      </li>
    );
  }

  function renderComingSoonSection(section: IntegrationSection) {
    return (
      <SettingsCard
        key={section.provider}
        title={section.name}
        description={section.roadmapDescription}
        footer={
          <span className={cn(badgeClass(), 'text-[10px] uppercase tracking-wide')}>Coming Soon</span>
        }
      >
        <p className="text-sm text-muted-foreground">
          Launching with Bold Max. Join the waitlist to get early access and help us prioritize this
          integration.
        </p>
      </SettingsCard>
    );
  }

  return (
    <SettingsShell
      title="Integrations"
      description="Connect streaming platforms once — go live from any meeting without signing in again."
    >
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      ) : (
        <div className="space-y-6">
          <SettingsCard
            title="YouTube"
            description={
              limits
                ? `${limits.channelCount} of ${limits.maxChannels} channel${limits.maxChannels === 1 ? '' : 's'} on your ${limits.tierLabel} plan`
                : 'Stream meetings to your YouTube channel.'
            }
            footer={
              shouldShowUpgrade && !canStream ? (
                <Link
                  href="/billing/upgrade"
                  className="inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
                >
                  Upgrade to Pro
                </Link>
              ) : canAddYoutube ? (
                <Button loading={connecting} onClick={() => void handleAddYoutube()}>
                  Add YouTube Channel
                </Button>
              ) : limits?.maxPlanComingSoon && limits.upgradePlanLabel ? (
                <p className="text-sm text-muted-foreground">
                  Multiple channels launch with {limits.upgradePlanLabel}.{' '}
                  <Link href="/max" className="font-medium text-foreground underline">
                    Join the waitlist
                  </Link>
                </p>
              ) : null
            }
          >
            {!canStream && shouldShowUpgrade ? (
              <p className="text-sm text-muted-foreground">
                YouTube Live requires Pro. Free plans include meetings without livestreaming.
              </p>
            ) : youtubeAccounts.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No YouTube channels connected yet.</p>
                <a
                  href={YOUTUBE_LIVE_LEARN_MORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  YouTube live requirements
                </a>
              </div>
            ) : (
              <ul>{youtubeAccounts.map(renderYoutubeAccount)}</ul>
            )}
          </SettingsCard>

          {sections
            .filter((s) => s.provider !== 'youtube')
            .map(renderComingSoonSection)}

          {isMaxPlanComingSoon() && (
            <SettingsCard
              title="Max — Launching Soon"
              description={limits?.maxPlanComingSoon ? MAX_PLAN_DISPLAY.foundingOffer : undefined}
            >
              <MaxWaitlistForm />
            </SettingsCard>
          )}
        </div>
      )}
    </SettingsShell>
  );
}
