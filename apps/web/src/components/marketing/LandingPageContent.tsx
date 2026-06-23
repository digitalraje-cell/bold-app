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
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip bg-background">
      <MarketingHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 pb-8 pt-14 sm:pb-12 sm:pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(158,122,255,0.14),transparent)]" />

          <div className="relative mx-auto max-w-5xl text-center">
            <h1 className="animate-v3-fade-up text-balance">
              <span className="block text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                {MARKETING_COPY.heroHeadline.slice(0, 3).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
              <span className="mt-3 block text-3xl font-bold leading-tight tracking-tight text-gradient-purple sm:mt-4 sm:text-4xl lg:text-[2.75rem]">
                {MARKETING_COPY.heroHeadline[3]}
              </span>
            </h1>

            <p
              className={cn(
                'mx-auto mt-8 max-w-3xl animate-v3-fade-up text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed',
              )}
            >
              {MARKETING_COPY.heroSubheadline}
            </p>

            <div className="mt-10 flex animate-v3-fade-up flex-col items-center justify-center gap-4 sm:flex-row">
              <StartMeetingLink>
                <Button size="lg" className="h-14 w-full min-w-[200px] px-8 sm:w-auto">
                  Start a Meeting
                </Button>
              </StartMeetingLink>
              <Link href="/join">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-full min-w-[200px] px-8 sm:w-auto"
                >
                  Join a Meeting
                </Button>
              </Link>
            </div>

            <HeroSocialProofBar className="mt-12 animate-v3-fade-up" />
          </div>

          <div className="relative mx-auto mt-14 max-w-6xl animate-v3-fade-up sm:mt-16">
            <MeetingPreviewShowcase />
          </div>
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
