'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Video,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Map,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubscriptionPlan } from '@boldmeet/shared';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { cn } from '@/lib/utils';
import { AppFooter } from '@/components/layout/AppFooter';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: '/dashboard' },
  { href: '/dashboard', label: 'Meetings', icon: Video, match: '/dashboard', meetingsTab: true },
  { href: '/billing', label: 'Billing', icon: CreditCard, match: '/billing' },
  { href: '/roadmap', label: 'Roadmap', icon: Map, match: '/roadmap' },
  { href: '/settings/profile', label: 'Settings', icon: Settings, match: '/settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plan = (session?.user?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
  const isAdmin = mounted && session?.user?.role === 'SUPER_ADMIN';
  const isPro = plan === SubscriptionPlan.PRO;

  function isNavActive(item: (typeof navItems)[number]) {
    if (!mounted) return false;
    if (item.meetingsTab) return pathname === '/dashboard';
    if (item.label === 'Dashboard') return pathname === '/dashboard';
    return pathname.startsWith(item.match);
  }

  return (
    <div className="flex min-h-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-start gap-2">
            <BoldLogo href="/dashboard" size="sm" showTagline className="min-w-0 flex-1" />
            <button
              className="ml-auto shrink-0 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isNavActive(item)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Link
                href="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  pathname.startsWith('/admin/users')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Users className="h-4 w-4" />
                Admin Users
              </Link>
              <Link
                href="/admin/payments"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  pathname.startsWith('/admin/payments')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Shield className="h-4 w-4" />
                Admin Payments
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 px-3" suppressHydrationWarning>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{mounted ? session?.user?.name : null}</p>
              {mounted && isPro && (
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  Pro
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {mounted ? session?.user?.email : null}
            </p>
            {mounted && !isPro && (
              <div className="mt-3">
                <UpgradeBanner compact />
              </div>
            )}
            {mounted && (
              <Link
                href="/settings/account"
                className="mt-2 inline-block text-xs text-muted-foreground hover:text-primary"
              >
                Account settings
              </Link>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border px-6 py-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <BoldLogo href="/dashboard" size="sm" variant="icon" />
        </header>
        <main className="flex-1 p-6">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
