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
import { SubscriptionPlan, isPlatformAdmin } from '@boldmeet/shared';
import { cn } from '@/lib/utils';
import { navLinkClass } from '@/lib/ui';
import { appConfig } from '@/lib/app-config';
import { AppFooter } from '@/components/layout/AppFooter';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { usePermissions } from '@/hooks/usePermissions';

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

  const { plan } = usePermissions();
  const isAdmin = mounted && isPlatformAdmin(session?.user?.role, session?.user?.email);
  const isPro = plan !== SubscriptionPlan.FREE;

  function isNavActive(item: (typeof navItems)[number]) {
    if (!mounted) return false;
    if (item.meetingsTab) return pathname === '/dashboard';
    if (item.label === 'Dashboard') return pathname === '/dashboard';
    return pathname.startsWith(item.match);
  }

  return (
    <div className="flex min-h-full bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface shadow-[var(--shadow-elevated)] transition-transform lg:static lg:translate-x-0 lg:shadow-none',
          'border-r border-border/50',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {appConfig.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg font-semibold tracking-tight">{appConfig.name}</span>
          <button
            type="button"
            className="ml-auto rounded-[var(--radius-sm)] p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass(isNavActive(item))}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass(pathname === '/admin')}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <Link
                href="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass(pathname.startsWith('/admin/users'))}
              >
                <Users className="h-4 w-4" />
                Admin Users
              </Link>
              <Link
                href="/admin/payments"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass(pathname.startsWith('/admin/payments'))}
              >
                <Shield className="h-4 w-4" />
                Admin Payments
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div className="mb-3 rounded-[var(--radius-md)] bg-muted/60 px-3 py-3" suppressHydrationWarning>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{mounted ? session?.user?.name : null}</p>
              {mounted && isPro && (
                <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                  {plan === SubscriptionPlan.ENTERPRISE ? 'Enterprise' : 'Pro'}
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
                className="mt-2 inline-block text-xs text-muted-foreground transition hover:text-foreground"
              >
                Account settings
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(navLinkClass(false), 'w-full')}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border/50 bg-surface/80 px-6 py-4 backdrop-blur-md lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-[var(--radius-sm)] p-1">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold tracking-tight">{appConfig.name}</span>
        </header>
        <main className="flex-1 p-6 sm:p-8 lg:p-10">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
