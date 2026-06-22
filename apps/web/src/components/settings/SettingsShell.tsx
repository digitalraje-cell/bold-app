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
import { isPlatformAdmin } from '@boldmeet/shared';
import { cardClass, navLinkClass, ui } from '@/lib/ui';

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
  const isAdmin = isPlatformAdmin(session?.user?.role, session?.user?.email);

  const nav = isAdmin
    ? [...baseNav, { href: '/settings/admin', label: 'Admin', icon: Settings2 }]
    : baseNav;

  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={navLinkClass(active)}>
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
      <div className="mb-10">
        <h1 className={ui.pageTitle}>Settings</h1>
        <p className={ui.pageSubtitle}>
          Manage your profile, preferences, and subscription.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <aside className="lg:w-56 lg:shrink-0">
          <SettingsNav />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-8">
            <h2 className={ui.sectionTitle}>{title}</h2>
            {description && <p className={ui.sectionSubtitle}>{description}</p>}
          </div>
          <div className="space-y-6">{children}</div>
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
    <section className={cardClass()}>
      {(title || description) && (
        <div className="border-b border-border/50 px-6 py-5 sm:px-8">
          {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
      {footer && (
        <div className="border-t border-border/50 px-6 py-4 sm:px-8">{footer}</div>
      )}
    </section>
  );
}
