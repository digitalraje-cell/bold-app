'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { appVersion, buildTimestamp } from '@/lib/version';

const supportLinks = [
  { href: '/contact', label: 'Contact Support' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/roadmap', label: 'Roadmap' },
];

export function SupportSettings() {
  return (
    <SettingsShell title="Support" description="Help, policies, and product updates.">
      <SettingsCard title="Help & policies">
        <ul className="divide-y divide-border">
          {supportLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between py-3 text-sm font-medium transition hover:text-foreground"
              >
                {label}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="App version">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-medium text-foreground">{appVersion}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Build date</dt>
            <dd className="font-medium text-foreground">{buildTimestamp}</dd>
          </div>
        </dl>
      </SettingsCard>

      <SettingsCard title="Contact" description={`Response time: ${LEGAL_CONFIG.responseTime}`}>
        <p className="text-sm text-muted-foreground">
          Email{' '}
          <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-foreground underline-offset-4 hover:underline">
            {LEGAL_CONFIG.supportEmail}
          </a>{' '}
          for billing, meetings, or account help.
        </p>
      </SettingsCard>
    </SettingsShell>
  );
}
