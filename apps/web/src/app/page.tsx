import Link from 'next/link';
import { PricingSection } from '@/components/marketing/PricingSection';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { Button } from '@/components/ui/Button';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip">
      <MarketingHeader active="pricing" />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className={cn(ui.eyebrow, 'mb-8')}>
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
            Browser-based · No install required
          </div>

          <h1 className={ui.pageTitle}>
            Professional meetings,
            <span className="block">right in your browser</span>
          </h1>

          <p className={cn('mx-auto max-w-2xl', ui.pageSubtitle)}>
            Host HD video calls, stream to your YouTube channel, and collaborate with chat,
            reactions, and real-time controls — all without downloading an app.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="h-14 w-full px-8 sm:w-auto">
                Start for free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="h-14 w-full px-8 sm:w-auto">
                Join a meeting
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-28 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              title: 'HD Video & Audio',
              description:
                'Crystal-clear meetings powered by Jitsi Meet — camera, mic, and screen sharing built in.',
            },
            {
              title: 'YouTube Streaming',
              description:
                'Stream and record directly to your own YouTube channel. Your content, your account.',
            },
            {
              title: 'Host Controls',
              description:
                'Waiting rooms, co-hosts, mute controls, raise hand, reactions, and feature toggles.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={cn(cardClass({ interactive: true }), 'p-7 text-left')}
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <PricingSection />
      </main>

      <PageCta />

      <MarketingFooter />
    </div>
  );
}
