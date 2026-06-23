import Link from 'next/link';
import { PricingSection } from '@/components/marketing/PricingSection';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { HeroSocialProofBar } from '@/components/marketing/HeroSocialProofBar';
import { HeroUsedForSection } from '@/components/marketing/HeroUsedForSection';
import { DifferentiatorSection } from '@/components/marketing/DifferentiatorSection';
import { MeetingPreviewShowcase } from '@/components/marketing/MeetingPreviewShowcase';
import { PageCta } from '@/components/marketing/PageCta';
import { StartMeetingLink } from '@/components/auth/StartMeetingLink';
import { Button } from '@/components/ui/Button';
import { MARKETING_COPY } from '@/lib/marketing-copy';
import { cn } from '@/lib/utils';

export function LandingPageContent() {
  return (
    <div className="flex min-h-full min-w-0 flex-col bg-background">
      <MarketingHeader theme="hero" />

      <main className="flex flex-1 flex-col overflow-x-clip">
        <section className="marketing-hero relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 marketing-hero-glow opacity-80" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-10 lg:pb-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="animate-v3-fade-up text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-purple-light)]/90 sm:text-sm">
                Meeting + Webinar + Streaming
              </p>

              <h1 className="animate-v3-fade-up mt-4 text-balance sm:mt-5">
                <span className="block text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  {MARKETING_COPY.heroHeadlinePrimary}
                </span>
                <span className="mt-2 block text-[1.5rem] font-bold leading-[1.15] tracking-tight text-gradient-purple sm:mt-3 sm:text-4xl lg:text-[2.75rem]">
                  {MARKETING_COPY.heroHeadlineAccent}
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl animate-v3-fade-up text-base leading-relaxed text-white/65 sm:mt-6 sm:text-lg sm:leading-relaxed">
                {MARKETING_COPY.heroSubheadline}
              </p>

              <div className="mt-7 flex animate-v3-fade-up flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <StartMeetingLink>
                  <Button size="lg" className="h-12 w-full min-w-[180px] px-8 sm:h-14 sm:w-auto">
                    Start Meeting
                  </Button>
                </StartMeetingLink>
                <Link href="/join">
                  <Button
                    variant="secondary"
                    size="lg"
                    className={cn(
                      'h-12 w-full min-w-[180px] border-white/20 bg-white/10 px-8 text-white',
                      'hover:border-white/30 hover:bg-white/15 hover:text-white sm:h-14 sm:w-auto',
                    )}
                  >
                    Join Meeting
                  </Button>
                </Link>
              </div>

              <p className="mt-4 animate-v3-fade-up text-xs font-medium text-white/45 sm:text-sm">
                {MARKETING_COPY.heroTrustLine}
              </p>

              <HeroSocialProofBar variant="dark" className="mt-6 animate-v3-fade-up sm:mt-8" />
            </div>

            <div className="relative mx-auto mt-8 max-w-6xl animate-v3-fade-up sm:mt-10 lg:mt-12">
              <div
                className="pointer-events-none absolute inset-x-[5%] top-[8%] -z-10 h-[55%] marketing-hero-mockup-glow"
                aria-hidden
              />
              <div
                className={cn(
                  'relative overflow-hidden rounded-[var(--radius-xl)]',
                  'shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)]',
                  'ring-1 ring-[var(--accent-purple)]/25',
                  'max-h-[44vh] min-h-[240px] sm:max-h-[52vh] md:max-h-none md:overflow-visible',
                )}
              >
                <MeetingPreviewShowcase className="rounded-none border-0 shadow-none ring-0 md:rounded-[var(--radius-xl)]" />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
        </section>

        <HeroUsedForSection />

        <DifferentiatorSection />

        <PricingSection />
      </main>

      <PageCta secondaryHref="/pricing" />

      <MarketingFooter />
    </div>
  );
}
