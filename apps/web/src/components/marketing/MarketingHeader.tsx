import Link from 'next/link';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { cn } from '@/lib/utils';

export function MarketingHeader({ active }: { active?: 'pricing' | 'roadmap' }) {
  const navLink = (href: string, label: string, key: 'pricing' | 'roadmap') => (
    <Link
      href={href}
      className={cn(
        'hidden rounded-xl px-4 py-2 text-sm font-medium transition sm:inline-block',
        active === key
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <BoldLogo href="/" size="md" />
        <nav className="flex items-center gap-2 sm:gap-3">
          {navLink('/#pricing', 'Pricing', 'pricing')}
          {navLink('/roadmap', 'Roadmap', 'roadmap')}
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:px-4"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90 sm:px-4"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <BoldLogo href="/" size="md" showTagline />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/#pricing" className="transition hover:text-primary">
              Pricing
            </Link>
            <Link href="/roadmap" className="transition hover:text-primary">
              Roadmap
            </Link>
            <Link href="/privacy" className="transition hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/refund" className="transition hover:text-primary">
              Refund Policy
            </Link>
            <Link href="/cookies" className="transition hover:text-primary">
              Cookie Policy
            </Link>
            <Link href="/contact" className="transition hover:text-primary">
              Contact
            </Link>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Start free
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} {LEGAL_CONFIG.companyName} · {LEGAL_CONFIG.productName}
        </p>
      </div>
    </footer>
  );
}
