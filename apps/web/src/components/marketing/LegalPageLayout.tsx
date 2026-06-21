import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { APP_CONFIG } from '@/lib/app-config';

export function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1 px-6 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <h1>{title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          {children}
          <hr />
          <p className="text-sm text-muted-foreground">
            Questions? Contact{' '}
            <Link href="/contact" className="text-primary hover:underline">
              {APP_CONFIG.supportEmail ?? 'support'}
            </Link>
            .
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
