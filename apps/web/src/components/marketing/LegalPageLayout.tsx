import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { getPublicDisplayDomain } from '@/lib/public-display';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

export type LegalTocItem = { id: string; title: string };

const RELATED_LEGAL = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/contact', label: 'Contact' },
] as const;

export function LegalPageLayout({
  title,
  description,
  sections,
  children,
}: {
  title: string;
  description?: string;
  sections?: LegalTocItem[];
  children: React.ReactNode;
}) {
  const lastUpdated = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex min-h-full flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-[var(--badge-bg)]/30 px-6 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className={ui.eyebrow}>Legal</p>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="sr-only">Operator</dt>
                <dd>
                  {LEGAL_CONFIG.productName} · {LEGAL_CONFIG.companyName}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Domain</dt>
                <dd>{getPublicDisplayDomain()}</dd>
              </div>
              <div>
                <dt className="sr-only">Last updated</dt>
                <dd>Updated {lastUpdated}</dd>
              </div>
            </dl>
            <TrustStrip className="mt-8" />
          </div>
        </section>

        <section className="px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                'lg:grid lg:gap-12',
                sections?.length ? 'lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]' : '',
              )}
            >
              {sections && sections.length > 0 && (
                <aside className="mb-8 lg:mb-0">
                  <nav
                    className={cn(
                      cardClass({ bordered: true }),
                      'p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto',
                    )}
                    aria-label="Table of contents"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      On this page
                    </p>
                    <ul className="mt-4 space-y-1">
                      {sections.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </aside>
              )}

              <article className="legal-document mx-auto w-full max-w-[900px] lg:mx-0">
                <div className={cn(cardClass({ bordered: true }), 'p-8 sm:p-10 lg:p-12')}>
                  <div className="legal-document-body">{children}</div>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Related documents
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RELATED_LEGAL.map((doc) => (
                      <Link key={doc.href} href={doc.href} className={badgeClass('hover:shadow-[var(--shadow-soft)]')}>
                        {doc.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                  Questions about this document?{' '}
                  <Link href="/contact" className={ui.link}>
                    Contact {LEGAL_CONFIG.supportEmail}
                  </Link>
                </p>
              </article>
            </div>
          </div>
        </section>

        <PageCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
