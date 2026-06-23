import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { PricingSection } from '@/components/marketing/PricingSection';

export function PricingPageContent() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader active="pricing" />

      <main className="flex-1">
        <PricingSection />
      </main>

      <PageCta secondaryHref="/features" secondaryLabel="View features" />
      <MarketingFooter />
    </div>
  );
}
