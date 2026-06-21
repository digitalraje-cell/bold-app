'use client';

import Link from 'next/link';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { Button } from '@/components/ui/Button';

const adminLinks = [
  {
    href: '/admin/users',
    title: 'Users',
    description: 'View all users, activate Pro, or deactivate Pro on any account.',
  },
  {
    href: '/admin/payments',
    title: 'Payments',
    description: 'Review pending Razorpay payments and activate Pro after verification.',
  },
];

export function AdminSettings() {
  return (
    <SettingsShell title="Admin" description="Platform administration (admin only).">
      <div className="space-y-4">
        {adminLinks.map(({ href, title, description }) => (
          <SettingsCard key={href} title={title} description={description}>
            <Link href={href}>
              <Button>Open {title.toLowerCase()}</Button>
            </Link>
          </SettingsCard>
        ))}
      </div>
    </SettingsShell>
  );
}
