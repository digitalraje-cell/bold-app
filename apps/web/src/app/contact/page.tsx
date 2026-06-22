import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LegalSection } from '@/components/marketing/legal/LegalSection';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';

export const metadata: Metadata = createLegalMetadata({
  title: 'Contact Us',
  description:
    'Contact BoldMeet support — Lifetop Academy help with meetings, billing, Pro subscriptions, and technical issues. Response within 48 business hours.',
  path: '/contact',
});

const CONTACT_SECTIONS = [
  { id: 'company-information', label: 'Company Information' },
  { id: 'common-topics', label: 'Common Topics' },
  { id: 'send-message', label: 'Send a Message' },
] as const;

export default function ContactPage() {
  const {
    productName,
    companyName,
    websiteUrl,
    supportEmail,
    businessEmail,
    responseTime,
  } = LEGAL_CONFIG;

  return (
    <LegalPageLayout
      title="Contact Us"
      subtitle="Get help with account access, meetings, billing, and technical support."
      sections={[...CONTACT_SECTIONS]}
    >
      <p>
        We&apos;re here to help with account access, meetings, billing, Pro upgrades, refunds, and
        technical support for {productName}.
      </p>

      <LegalSection id="company-information">Company information</LegalSection>
      <dl className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{productName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{companyName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{websiteUrl}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response time</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{responseTime}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support email</dt>
          <dd className="mt-1">
            <a href={`mailto:${supportEmail}`} className="text-sm font-medium text-primary hover:underline">
              {supportEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business email</dt>
          <dd className="mt-1">
            <a href={`mailto:${businessEmail}`} className="text-sm font-medium text-primary hover:underline">
              {businessEmail}
            </a>
          </dd>
        </div>
      </dl>

      <LegalSection id="common-topics">Common topics</LegalSection>
      <ul>
        <li>
          <strong>Login &amp; OTP</strong> — trouble receiving or verifying your email code.
        </li>
        <li>
          <strong>Meetings</strong> — audio, video, screen share, or join issues.
        </li>
        <li>
          <strong>Billing &amp; Pro</strong> — payment confirmation, Pro activation, refunds. See{' '}
          <Link href="/billing" className="text-primary hover:underline">
            Billing
          </Link>{' '}
          when signed in.
        </li>
        <li>
          <strong>Partnerships</strong> — enterprise, education, or custom integrations via{' '}
          {businessEmail}.
        </li>
      </ul>

      <LegalSection id="send-message">Send us a message</LegalSection>
      <ContactForm />
    </LegalPageLayout>
  );
}
