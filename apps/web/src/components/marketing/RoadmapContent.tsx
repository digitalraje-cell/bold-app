'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ThumbsUp, Loader2, Check, Clock, Sparkles } from 'lucide-react';
import {
  ROADMAP_AVAILABLE_NOW,
  ROADMAP_COMING_SOON,
  ROADMAP_VOTABLE_FEATURES,
  SubscriptionPlan,
  PLAN_PRICING_INR,
} from '@boldmeet/shared';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

type VoteRow = {
  key: string;
  title: string;
  voteCount: number;
  voted: boolean;
};

const NOW_FEATURES = [
  ...ROADMAP_AVAILABLE_NOW,
  'YouTube Live Streaming',
  'Co-hosts',
  'Waiting Room',
  'Host Controls',
] as const;

const NEXT_FEATURES = ROADMAP_COMING_SOON.slice(0, 3);
const LATER_FEATURES = ROADMAP_COMING_SOON.slice(3);

function PhaseHeader({
  label,
  title,
  description,
  icon: Icon,
}: {
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3">
        <div className={ui.iconWell}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={badgeClass('text-[10px] uppercase')}>{label}</span>
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  proIncluded,
  status,
}: {
  title: string;
  proIncluded?: boolean;
  status: 'live' | 'building' | 'planned';
}) {
  const statusLabel = { live: 'Live', building: 'In progress', planned: 'Planned' } as const;

  return (
    <li
      className={cn(
        cardClass({ bordered: true }),
        'flex items-center justify-between gap-4 px-5 py-4',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            status === 'live'
              ? 'bg-foreground'
              : status === 'building'
                ? 'bg-foreground/50'
                : 'bg-border',
          )}
          aria-hidden
        />
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {proIncluded && <span className={badgeClass('text-[10px] uppercase')}>Pro</span>}
        <span className="text-xs font-medium text-muted-foreground">{statusLabel[status]}</span>
      </div>
    </li>
  );
}

export function RoadmapContent() {
  const { status } = useSession();
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingKey, setVotingKey] = useState<string | null>(null);

  const loadVotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.roadmap.votes(status === 'authenticated')) as VoteRow[];
      setVotes(data);
    } catch {
      setVotes(
        ROADMAP_VOTABLE_FEATURES.map((f) => ({
          key: f.key,
          title: f.title,
          voteCount: 0,
          voted: false,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadVotes();
  }, [loadVotes]);

  async function toggleVote(featureKey: string, currentlyVoted: boolean) {
    if (status !== 'authenticated') {
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/roadmap')}`;
      return;
    }
    setVotingKey(featureKey);
    try {
      if (currentlyVoted) await api.roadmap.removeVote(featureKey);
      else await api.roadmap.vote(featureKey);
      await loadVotes();
    } finally {
      setVotingKey(null);
    }
  }

  const voteByKey = Object.fromEntries(votes.map((v) => [v.key, v]));
  const sortedFeatures = [...ROADMAP_VOTABLE_FEATURES].sort((a, b) => {
    const countA = voteByKey[a.key]?.voteCount ?? 0;
    const countB = voteByKey[b.key]?.voteCount ?? 0;
    return countB - countA;
  });

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader active="roadmap" />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-[var(--badge-bg)]/30 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className={ui.eyebrow}>Product roadmap</p>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
              Now, next, and later
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              We ship in public. See what&apos;s live today, what we&apos;re building next, and vote
              on what matters most to you.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl space-y-20">
            <div>
              <PhaseHeader
                label="Now"
                title="Available today"
                description="Core meeting features you can use right now — no install, no waiting."
                icon={Check}
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {NOW_FEATURES.map((title) => (
                  <FeatureCard key={title} title={title} status="live" />
                ))}
              </ul>
            </div>

            <div className="border-t border-border/60 pt-20">
              <PhaseHeader
                label="Next"
                title="Actively building"
                description="In development now — these ship before the rest of the backlog."
                icon={Clock}
              />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NEXT_FEATURES.map((item) => (
                  <FeatureCard
                    key={item.title}
                    title={item.title}
                    proIncluded={item.proIncluded}
                    status="building"
                  />
                ))}
              </ul>
            </div>

            <div className="border-t border-border/60 pt-20">
              <PhaseHeader
                label="Later"
                title="On the horizon"
                description="Planned features we're designing and scoping for future releases."
                icon={Sparkles}
              />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LATER_FEATURES.map((item) => (
                  <FeatureCard
                    key={item.title}
                    title={item.title}
                    proIncluded={item.proIncluded}
                    status="planned"
                  />
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-[var(--badge-bg)]/30 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className={ui.sectionTitle}>Vote for what we build next</h2>
            <p className={cn(ui.sectionSubtitle, 'max-w-2xl')}>
              Sign in to vote once per feature. Your vote directly shapes our priorities.
            </p>

            {loading ? (
              <div className="mt-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedFeatures.map((feature, index) => {
                  const row = voteByKey[feature.key];
                  const count = row?.voteCount ?? 0;
                  const voted = row?.voted ?? false;

                  return (
                    <div
                      key={feature.key}
                      className={cn(
                        cardClass({ interactive: true }),
                        'relative flex flex-col p-7',
                        voted && 'ring-1 ring-foreground/10',
                      )}
                    >
                      {index === 0 && count > 0 && (
                        <span className="absolute right-5 top-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Top voted
                        </span>
                      )}
                      <div className="flex flex-wrap items-start justify-between gap-2 pr-16">
                        <h3 className="font-semibold leading-snug">{feature.title}</h3>
                        {feature.proIncluded && (
                          <span className={badgeClass('text-[10px] uppercase')}>Pro</span>
                        )}
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-5">
                        <p className="text-sm font-semibold tabular-nums">
                          {count}
                          <span className="ml-1 font-normal text-muted-foreground">
                            vote{count === 1 ? '' : 's'}
                          </span>
                        </p>
                        <Button
                          variant={voted ? 'secondary' : 'primary'}
                          size="sm"
                          loading={votingKey === feature.key}
                          onClick={() => void toggleVote(feature.key, voted)}
                        >
                          <ThumbsUp className={cn('h-4 w-4', voted && 'fill-current')} />
                          {voted ? 'Voted' : 'Vote'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border/60 px-6 py-16 sm:py-20">
          <div className={cn(cardClass(), 'mx-auto max-w-3xl p-10 text-center sm:p-12')}>
            <span className={badgeClass()}>
              Early Founder Pricing — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              Get early access to what we ship
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Pro members get priority access to new features, YouTube recording, co-hosts, and
              advanced attendee management.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/billing/upgrade">
                <Button size="lg">Upgrade — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/mo</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Start free
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <PageCta title="Start your first meeting" />
      </main>

      <MarketingFooter />
    </div>
  );
}
