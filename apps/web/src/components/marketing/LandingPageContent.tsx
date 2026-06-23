import Link from 'next/link';
import {
  Globe,
  Lock,
  Radio,
  Shield,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';
import { PricingSection } from '@/components/marketing/PricingSection';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MeetingPreviewShowcase } from '@/components/marketing/MeetingPreviewShowcase';
import { PageCta } from '@/components/marketing/PageCta';
import { StartMeetingLink } from '@/components/auth/StartMeetingLink';
import { Button } from '@/components/ui/Button';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Video,
    title: 'HD Video Meetings',
    description: 'Crystal-clear audio and video for professional conversations.',
  },
  {
    icon: Radio,
    title: 'YouTube Live Streaming',
    description: 'Broadcast meetings directly to your audience in one click.',
  },
  {
    icon: Shield,
    title: 'Host Controls',
    description: 'Manage participants, permissions and collaboration with confidence.',
  },
  {
    icon: Globe,
    title: 'Browser-Based',
    description: 'No downloads. No installations. Join instantly.',
  },
  {
    icon: Lock,
    title: 'Secure Access',
    description: 'Protected meetings with authentication and host controls.',
  },
  {
    icon: Zap,
    title: 'Fast Join Experience',
    description: 'Join meetings from links, IDs or recent sessions.',
  },
] as const;

const SOCIAL_PROOF = [
  { emoji: '⚡', title: 'Instant browser meetings' },
  { emoji: '🎥', title: 'HD video quality' },
  { emoji: '📺', title: 'YouTube Live streaming' },
  { emoji: '🔒', title: 'Secure access controls' },
  { emoji: '🌎', title: 'Works everywhere' },
  { emoji: '🚀', title: 'Install as a desktop or mobile app' },
] as const;

export function LandingPageContent() {
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip bg-background">
      <MarketingHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero — white background */}
        <section className="relative px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[var(--badge-bg)]/80 to-transparent" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className={cn(ui.eyebrow, 'mb-8 animate-v3-fade-up border-[var(--badge-border)] bg-surface')}>
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
              Browser-first · AI-powered meetings
            </div>

            <h1 className={cn(ui.pageTitle, 'animate-v3-fade-up')}>
              Professional Meetings.
              <span className="mt-1 block text-gradient-purple">Powered by Bold.</span>
            </h1>

            <p className={cn('mx-auto max-w-2xl animate-v3-fade-up', ui.pageSubtitle)}>
              Host HD video meetings, collaborate in real time, stream to YouTube, and connect with
              your team — without downloads or complicated setup.
            </p>

            <div className="mt-12 flex animate-v3-fade-up flex-col items-center justify-center gap-4 sm:flex-row">
              <StartMeetingLink>
                <Button size="lg" className="h-14 w-full px-8 sm:w-auto">
                  Start a Meeting
                </Button>
              </StartMeetingLink>
              <Link href="/join">
                <Button variant="secondary" size="lg" className="h-14 w-full px-8 sm:w-auto">
                  Join a Meeting
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl animate-v3-fade-up sm:mt-20">
            <MeetingPreviewShowcase />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 bg-surface-secondary px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className={ui.eyebrow}>Built for modern teams</p>
              <h2 className={cn('mt-6', ui.sectionTitle)}>
                Everything you need for professional video collaboration
              </h2>
              <p className={cn('mt-4', ui.sectionSubtitle)}>
                From instant browser joins to YouTube broadcasts — Bold keeps your meetings fast,
                secure, and polished.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className={cn(cardClass({ interactive: true }), 'p-7 text-left')}
                >
                  <div className={cn(ui.iconWell, 'mb-5 h-11 w-11')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={ui.sectionTitle}>Why teams choose Bold</h2>
              <p className={cn('mt-4', ui.sectionSubtitle)}>
                Premium meeting quality without the enterprise complexity.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SOCIAL_PROOF.map(({ emoji, title }) => (
                <div
                  key={title}
                  className={cn(
                    cardClass({ bordered: true }),
                    'flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-card)]',
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {emoji}
                  </span>
                  <p className="font-semibold text-foreground">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection />
      </main>

      <PageCta secondaryHref="/pricing" />

      <MarketingFooter />
    </div>
  );
}
