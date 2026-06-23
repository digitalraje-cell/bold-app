import Link from 'next/link';
import { Video, Radio, Shield, Users, Sparkles, LayoutGrid, Smartphone } from 'lucide-react';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { StartMeetingLink } from '@/components/auth/StartMeetingLink';
import { Button } from '@/components/ui/Button';
import { MARKETING_COPY } from '@/lib/marketing-copy';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Video,
    title: 'Browser-first meetings',
    description:
      'Start instantly in Chrome, Safari, or Edge. HD video, audio, and screen share — install optional for one-click launch.',
  },
  {
    icon: Radio,
    title: 'YouTube Live streaming',
    description: 'Stream meetings to your own YouTube channel with Pro. Recording and replay on your account.',
  },
  {
    icon: Users,
    title: 'Co-hosts & webinar mode',
    description: 'Promote participants, manage permissions, and switch between meeting and webinar layouts.',
  },
  {
    icon: Shield,
    title: 'Waiting rooms & host controls',
    description: 'Admit guests, mute all, lock the room, and keep sessions under your control.',
  },
  {
    icon: LayoutGrid,
    title: 'Flexible layouts',
    description: 'Tile, spotlight, and sidebar views with participant dock and smart control auto-hide.',
  },
  {
    icon: Sparkles,
    title: 'Reactions & engagement',
    description: 'Raise hand, chat, and live reactions to keep remote sessions energetic.',
  },
  {
    icon: Smartphone,
    title: 'Optional app install',
    description: MARKETING_COPY.pwaFeature,
  },
] as const;

export function FeaturesContent() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader active="features" />

      <main className="flex-1 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className={ui.eyebrow}>Features</p>
            <h1 className={cn('mt-6', ui.pageTitle)}>Everything you need to meet online</h1>
            <p className={cn('mt-4', ui.pageSubtitle)}>
              Bold combines professional video conferencing with streaming tools built for creators,
              educators, and teams. {MARKETING_COPY.browserFirstLine}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <StartMeetingLink>
                <Button size="lg">Start a Meeting</Button>
              </StartMeetingLink>
              <Link href="/join">
                <Button size="lg" variant="secondary">
                  Join a Meeting
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article key={title} className={cn(cardClass(), 'p-6 sm:p-7')}>
                <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--badge-bg)] text-[var(--accent-purple)]')}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </main>

      <PageCta secondaryHref="/pricing" />
      <MarketingFooter />
    </div>
  );
}
