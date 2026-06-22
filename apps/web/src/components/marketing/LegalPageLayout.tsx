import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { LegalInfoCards } from '@/components/marketing/legal/LegalInfoCards';
import { LegalPageFooter } from '@/components/marketing/legal/LegalPageFooter';
import {
  LegalTableOfContents,
  type LegalTocItem,
} from '@/components/marketing/legal/LegalTableOfContents';
import { LegalTrustSection } from '@/components/marketing/legal/LegalTrustSection';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export function LegalPageLayout({
  title,
  subtitle,
  sections,
  showInfoCards = true,
  children,
}: {
  title: string;
  subtitle: string;
  sections: LegalTocItem[];
  showInfoCards?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/80 via-muted/40 to-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <BoldLogo size="sm" className="mb-6" />
          <p className="mb-3 text-sm font-medium text-primary">Legal Center</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
          <p className="mt-6 inline-flex items-center rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            Last updated: {LEGAL_CONFIG.lastUpdated}
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          {showInfoCards && <LegalInfoCards />}

          <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
            <LegalTableOfContents items={sections} />

            <article className="legal-content min-w-0 max-w-[900px] flex-1">
              {children}
            </article>
          </div>
        </div>
      </main>

      <LegalTrustSection />
      <LegalPageFooter />
    </div>
  );
}
