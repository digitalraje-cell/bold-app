'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/meetings', label: 'Meetings' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/payments', label: 'Payments' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => {
        const active =
          link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
