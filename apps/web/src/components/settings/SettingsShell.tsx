'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User,
  Shield,
  Video,
  CreditCard,
  LifeBuoy,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const baseNav = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/account', label: 'Account', icon: Shield },
  { href: '/settings/meeting', label: 'Meeting Preferences', icon: Video },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/support', label: 'Support', icon: LifeBuoy },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const nav = isAdmin
    ? [...baseNav, { href: '/settings/admin', label: 'Admin', icon: Settings2 }]
    : baseNav;

  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, preferences, and subscription.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:w-56 lg:shrink-0">
          <SettingsNav />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      {(title || description) && (
        <div className="border-b border-border px-6 py-4">
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="border-t border-border px-6 py-4">{footer}</div>}
    </section>
  );
}
