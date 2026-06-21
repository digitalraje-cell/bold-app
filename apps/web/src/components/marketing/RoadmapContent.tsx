'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ThumbsUp, Loader2, Sparkles } from 'lucide-react';
import {
  ROADMAP_AVAILABLE_NOW,
  ROADMAP_Q3_2026,
  ROADMAP_Q4_2026,
  ROADMAP_VOTABLE_FEATURES,
  SubscriptionPlan,
  PLAN_PRICING_INR,
} from '@boldmeet/shared';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type VoteRow = {
  key: string;
  title: string;
  voteCount: number;
  voted: boolean;
};

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
      const fallback = ROADMAP_VOTABLE_FEATURES.map((f) => ({
        key: f.key,
        title: f.title,
        voteCount: 0,
        voted: false,
      }));
      setVotes(fallback);
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
      if (currentlyVoted) {
        await api.roadmap.removeVote(featureKey);
      } else {
        await api.roadmap.vote(featureKey);
      }
      await loadVotes();
    } finally {
      setVotingKey(null);
    }
  }

  const voteByKey = Object.fromEntries(votes.map((v) => [v.key, v]));

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader active="roadmap" />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/20 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Product roadmap</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Built in public</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              See what&apos;s live today, what&apos;s shipping next, and vote for the features you
              need most.
            </p>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <RoadmapSection title="Available now" items={[...ROADMAP_AVAILABLE_NOW]} status="live" />
            <RoadmapSection title="Coming Q3 2026" items={[...ROADMAP_Q3_2026]} status="soon" />
            <RoadmapSection title="Coming Q4 2026" items={[...ROADMAP_Q4_2026]} status="future" />
          </div>
        </section>

        <section className="border-t border-border bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold">Vote for what we build next</h2>
            <p className="mt-1 text-muted-foreground">
              Sign in to vote once per feature. Your vote helps us prioritise the roadmap.
            </p>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ROADMAP_VOTABLE_FEATURES.map((feature) => {
                  const row = voteByKey[feature.key];
                  const count = row?.voteCount ?? 0;
                  const voted = row?.voted ?? false;

                  return (
                    <div
                      key={feature.key}
                      className="rounded-2xl border border-border bg-surface p-5"
                    >
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                      <p className="mt-4 text-sm font-medium text-primary">
                        {count} user{count === 1 ? '' : 's'} requested this feature
                      </p>
                      <Button
                        variant={voted ? 'secondary' : 'primary'}
                        className="mt-4 w-full"
                        loading={votingKey === feature.key}
                        onClick={() => void toggleVote(feature.key, voted)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {voted ? 'Voted' : 'Vote for this'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Early Founder Pricing — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Upgrade to Pro</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Pricing may increase after the founder launch period. Pro members get priority access,
              early releases, YouTube recording, co-host support, and advanced attendee management.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-muted-foreground">
              <li>✓ Priority feature access</li>
              <li>✓ Early access to new releases</li>
              <li>✓ YouTube recording &amp; co-hosts</li>
              <li>✓ Advanced attendee management</li>
            </ul>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/billing/upgrade">
                <Button size="lg">Upgrade to Pro — ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/mo</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Start free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function RoadmapSection({
  title,
  items,
  status,
}: {
  title: string;
  items: string[];
  status: 'live' | 'soon' | 'future';
}) {
  return (
    <div className="mb-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase',
            status === 'live' && 'bg-green-500/10 text-green-700 dark:text-green-400',
            status === 'soon' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            status === 'future' && 'bg-muted text-muted-foreground',
          )}
        >
          {status === 'live' ? 'Live' : status === 'soon' ? 'Q3 2026' : 'Q4 2026'}
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          >
            {status === 'live' ? (
              <Sparkles className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
