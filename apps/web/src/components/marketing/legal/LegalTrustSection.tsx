import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export function LegalTrustSection() {
  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Questions?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Contact our support team and we&apos;ll respond within 48 hours.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            Contact support
          </Link>
          <a
            href={`mailto:${LEGAL_CONFIG.supportEmail}`}
            className="inline-flex rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {LEGAL_CONFIG.supportEmail}
          </a>
        </div>
      </div>
    </section>
  );
}
