'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LogOut, Menu, X } from 'lucide-react';
import { AuthAwareLink } from '@/components/auth/AuthAwareLink';
import { StartMeetingLink } from '@/components/auth/StartMeetingLink';
import { performSignOut } from '@/lib/client-auth';
import { HomeLogoLink } from '@/components/layout/HomeLogoLink';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { navLinkClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

type NavKey = 'pricing' | 'roadmap' | 'about' | 'features';

const NAV_ITEMS: { href: string; label: string; key: NavKey }[] = [
  { href: '/about', label: 'About', key: 'about' },
  { href: '/features', label: 'Features', key: 'features' },
  { href: '/pricing', label: 'Pricing', key: 'pricing' },
  { href: '/roadmap', label: 'Roadmap', key: 'roadmap' },
];

const AUTH_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/meetings', label: 'Meetings' },
  { href: '/billing', label: 'Billing' },
] as const;

function heroNavLinkClass(active: boolean, mobile = false) {
  return cn(
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
    active ? 'marketing-header-hero-nav--active' : 'marketing-header-hero-nav',
    mobile ? 'block w-full text-left' : 'hidden sm:inline-block',
  );
}

function heroTextButtonClass(mobile = false) {
  return cn(
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 marketing-header-hero-nav',
    mobile && 'mt-2 block w-full text-left',
  );
}

function AuthActions({
  mobile = false,
  onNavigate,
  isHero = false,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
  isHero?: boolean;
}) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  if (isAuthenticated) {
    return (
      <>
        {AUTH_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              isHero ? heroTextButtonClass(mobile) : navLinkClass(false),
              !isHero && (mobile ? 'block w-full text-left' : 'hidden sm:inline-block'),
              isHero && mobile && 'block w-full text-left',
            )}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void performSignOut();
          }}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
            isHero
              ? heroTextButtonClass(mobile)
              : 'text-muted-foreground hover:text-foreground',
            mobile && !isHero && 'mt-2 w-full justify-start',
            mobile && isHero && 'inline-flex w-full justify-start',
          )}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <AuthAwareLink
        href="/login"
        className={cn(
          isHero
            ? heroTextButtonClass(mobile)
            : 'rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground',
          mobile && 'mt-2 block',
        )}
        onClick={onNavigate}
      >
        Login
      </AuthAwareLink>
      <StartMeetingLink
        className={cn(
          'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold',
          isHero
            ? 'marketing-header-hero-cta'
            : 'btn-primary-gradient text-white shadow-[var(--shadow-soft)]',
          mobile && 'mt-1 block w-full text-center',
        )}
        onClick={onNavigate}
      >
        Start a Meeting
      </StartMeetingLink>
    </>
  );
}

export function MarketingHeader({
  active,
  theme = 'default',
}: {
  active?: NavKey;
  theme?: 'default' | 'hero';
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHero = theme === 'hero';

  const linkClass = (key: NavKey, mobile = false) =>
    isHero
      ? heroNavLinkClass(active === key, mobile)
      : cn(navLinkClass(active === key), mobile ? 'block w-full text-left' : 'hidden sm:inline-block');

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        isHero
          ? 'marketing-header-hero'
          : 'border-b border-border/40 bg-background/85 backdrop-blur-xl',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
        <HomeLogoLink
          variant="marketing"
          wordmarkClassName={cn(
            'text-xl sm:text-2xl',
            isHero && 'drop-shadow-[0_0_28px_rgba(124,58,237,0.35)]',
          )}
          className={cn(
            'min-w-0 shrink-0 overflow-visible',
            isHero && 'pl-1.5 sm:pl-2.5',
          )}
        />

        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className={linkClass(item.key)}>
              {item.label}
            </Link>
          ))}
          <AuthActions isHero={isHero} />
        </nav>

        <button
          type="button"
          className={cn(
            'inline-flex rounded-xl border p-2 sm:hidden',
            isHero
              ? 'border-white/12 text-white/90 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
              : 'border-border text-foreground',
          )}
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className={cn(
            'border-t px-5 py-4 sm:hidden sm:px-8',
            isHero
              ? 'border-white/[0.06] bg-[#030308]/92 backdrop-blur-xl'
              : 'border-border bg-surface',
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={linkClass(item.key, true)}
                onClick={closeMobile}
              >
                {item.label}
              </Link>
            ))}
            <AuthActions mobile isHero={isHero} onNavigate={closeMobile} />
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex justify-center overflow-visible sm:justify-start">
          <HomeLogoLink variant="marketing" className="overflow-visible pl-1 sm:pl-2" />
        </div>
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {LEGAL_CONFIG.companyName} · {LEGAL_CONFIG.productName}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
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
            <AuthAwareLink href="/login" className={ui.link}>
              Start a Meeting
            </AuthAwareLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
