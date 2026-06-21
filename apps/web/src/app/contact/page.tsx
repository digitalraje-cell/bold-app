import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';

export const metadata: Metadata = createLegalMetadata({
  title: 'Contact Us',
  description:
    'Contact BoldMeet support — Lifetop Academy help with meetings, billing, Pro subscriptions, and technical issues. Response within 48 business hours.',
  path: '/contact',
});

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
    <LegalPageLayout title="Contact Us">
      <p>
        We&apos;re here to help with account access, meetings, billing, Pro upgrades, refunds, and
        technical support for {productName}.
      </p>

      <h2>Company information</h2>
      <dl className="not-prose grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-foreground">Product</dt>
          <dd className="text-muted-foreground">{productName}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Company</dt>
          <dd className="text-muted-foreground">{companyName}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Website</dt>
          <dd className="text-muted-foreground">{websiteUrl}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Support email</dt>
          <dd>
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Business email</dt>
          <dd>
            <a href={`mailto:${businessEmail}`} className="text-primary hover:underline">
              {businessEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Response time</dt>
          <dd className="text-muted-foreground">{responseTime}</dd>
        </div>
      </dl>

      <h2>Common topics</h2>
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

      <h2>Send us a message</h2>
      <ContactForm />
    </LegalPageLayout>
  );
}
