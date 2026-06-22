'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { APP_CONFIG } from '@/lib/app-config';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { cn } from '@/lib/utils';

type NavKey = 'pricing' | 'roadmap' | 'about';

const NAV_ITEMS: { href: string; label: string; key: NavKey }[] = [
  { href: '/about', label: 'About', key: 'about' },
  { href: '/#pricing', label: 'Pricing', key: 'pricing' },
  { href: '/roadmap', label: 'Roadmap', key: 'roadmap' },
];

function BrandMark() {
  const appName = APP_CONFIG.name;
  const logoLetter = appName.charAt(0).toUpperCase();

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        {logoLetter}
      </div>
      <span className="text-xl font-semibold tracking-tight">{appName}</span>
    </Link>
  );
}

export function MarketingHeader({ active }: { active?: NavKey }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (key: NavKey, mobile = false) =>
    cn(
      'rounded-xl px-4 py-2 text-sm font-medium transition',
      mobile ? 'block w-full text-left' : 'hidden sm:inline-block',
      active === key
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <BrandMark />

        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className={linkClass(item.key)}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90"
          >
            Get started
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex rounded-xl border border-border p-2 text-foreground sm:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface px-6 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={linkClass(item.key, true)}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="mt-2 block rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="mt-1 block rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {LEGAL_CONFIG.companyName} · {LEGAL_CONFIG.productName}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/#pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/roadmap" className="hover:text-foreground">
              Roadmap
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-foreground">
              Refund Policy
            </Link>
            <Link href="/cookies" className="hover:text-foreground">
              Cookie Policy
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Start free
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
