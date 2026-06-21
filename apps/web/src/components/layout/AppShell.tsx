'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Video,
  Film,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubscriptionPlan } from '@boldmeet/shared';
import { cn } from '@/lib/utils';
import { appConfig } from '@/lib/app-config';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard', label: 'Meetings', icon: Video },
  { href: '/recordings', label: 'Recordings', icon: Film },
  { href: '/billing', label: 'Billing & Plans', icon: CreditCard },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => mounted && pathname.startsWith(href);
  const plan = (session?.user?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;

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
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {appConfig.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg font-semibold">{appConfig.name}</span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive(href) && label !== 'Meetings'
                  ? 'bg-primary/10 text-primary'
                  : label === 'Meetings' && pathname === '/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 px-3" suppressHydrationWarning>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{mounted ? session?.user?.name : null}</p>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                  plan === SubscriptionPlan.PRO
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {plan === SubscriptionPlan.PRO ? 'Pro' : 'Free'}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {mounted ? session?.user?.email : null}
            </p>
            {mounted && plan === SubscriptionPlan.FREE && (
              <div className="mt-3">
                <UpgradeBanner compact />
              </div>
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
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">{appConfig.name}</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
