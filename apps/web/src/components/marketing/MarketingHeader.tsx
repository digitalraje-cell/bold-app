import Link from 'next/link';
import { APP_CONFIG } from '@/lib/app-config';
import { cn } from '@/lib/utils';

export function MarketingHeader({ active }: { active?: 'pricing' | 'roadmap' }) {
  const appName = APP_CONFIG.name;
  const logoLetter = appName.charAt(0).toUpperCase();

  const navLink = (href: string, label: string, key: 'pricing' | 'roadmap') => (
    <Link
      href={href}
      className={cn(
        'hidden rounded-lg px-4 py-2 text-sm font-medium transition sm:inline-block',
        active === key
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {logoLetter}
          </div>
          <span className="text-xl font-semibold tracking-tight">{appName}</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {navLink('/#pricing', 'Pricing', 'pricing')}
          {navLink('/roadmap', 'Roadmap', 'roadmap')}
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:px-4"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:px-4"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const appName = APP_CONFIG.name;

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/#pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/roadmap" className="hover:text-foreground">
            Roadmap
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/refund" className="hover:text-foreground">
            Refund
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Start free
          </Link>
        </div>
      </div>
    </footer>
  );
}
