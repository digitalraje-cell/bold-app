import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LegalSection } from '@/components/marketing/legal/LegalSection';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';

export const metadata: Metadata = createLegalMetadata({
  title: 'Privacy Policy',
  description:
    'BoldMeet Privacy Policy — how Lifetop Academy collects, uses, and protects your data for video meetings, webinars, and SaaS subscriptions.',
  path: '/privacy',
});

const PRIVACY_SECTIONS = [
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Data' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'international-transfers', label: 'International Transfers' },
  { id: 'children', label: 'Children' },
  { id: 'changes', label: 'Policy Changes' },
  { id: 'contact', label: 'Contact' },
] as const;

export default function PrivacyPolicyPage() {
  const { productName, companyName, websiteUrl, supportEmail } = LEGAL_CONFIG;

  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Learn how we collect, use, and protect your personal information."
      sections={[...PRIVACY_SECTIONS]}
    >
      <p>
        This Privacy Policy describes how {companyName} (&quot;{companyName}&quot;, &quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects personal
        information when you use {productName} ({websiteUrl}), our browser-based video
        conferencing, online meeting, and webinar platform offered as a software-as-a-service
        (SaaS) product.
      </p>
      <p>
        By creating an account, signing in, hosting or joining a meeting, or purchasing a
        subscription, you agree to this Privacy Policy.
      </p>

      <LegalSection id="information-we-collect">1. Information we collect</LegalSection>
      <h3>Account and authentication</h3>
      <ul>
        <li>
          <strong>Email address</strong> — required to create an account and sign in.
        </li>
        <li>
          <strong>One-time login codes (OTP)</strong> — we send verification codes to your email
          for authentication. OTP records are stored securely and expire after a short period.
        </li>
        <li>
          <strong>Display name</strong> — shown in meetings and your profile.
        </li>
        <li>
          <strong>Account metadata</strong> — subscription plan, verification status, and account
          creation date.
        </li>
      </ul>

      <h3>Meeting and collaboration data</h3>
      <ul>
        <li>
          <strong>Meeting metadata</strong> — meeting titles, schedules, passcodes (stored in
          encrypted form), participant display names, join/leave events, and host settings.
        </li>
        <li>
          <strong>In-meeting features</strong> — chat messages (real-time during meetings), raise-hand
          status, and reactions may be processed to deliver the service.
        </li>
        <li>
          <strong>Recording and streaming</strong> — if you use Pro features such as YouTube Live or
          recording integrations, we process stream configuration and related metadata. Video/audio
          streams are routed through our media and integration partners as described below.
        </li>
      </ul>

      <h3>Usage and analytics</h3>
      <ul>
        <li>
          <strong>Usage analytics</strong> — we collect aggregated and event-level usage data (e.g.
          meetings created, features used, plan type) to improve reliability, plan enforcement, and
          product development.
        </li>
        <li>
          <strong>Technical logs</strong> — IP address, browser type, device information, timestamps,
          and error logs for security, fraud prevention, and troubleshooting.
        </li>
      </ul>

      <h3>Payment information</h3>
      <p>
        Paid subscriptions (BoldMeet Pro) are processed by <strong>Razorpay</strong>. We do not store
        full credit or debit card numbers on our servers. We receive payment status, transaction
        references, and billing records necessary to activate and manage your subscription.
      </p>

      <h3>Cookies and similar technologies</h3>
      <p>
        We use cookies and similar technologies for authentication, session management, and service
        functionality. See our{' '}
        <Link href="/cookies" className="text-primary hover:underline">
          Cookie Policy
        </Link>{' '}
        for details.
      </p>

      <LegalSection id="how-we-use">2. How we use your information</LegalSection>
      <ul>
        <li>Provide, operate, and maintain {productName} meetings, chat, and collaboration features.</li>
        <li>Authenticate users via email OTP and maintain secure sessions.</li>
        <li>Process subscriptions, billing, and Pro plan activation.</li>
        <li>Enforce plan limits, prevent abuse, and protect platform security.</li>
        <li>Send service-related communications (e.g. login codes, billing confirmations).</li>
        <li>Analyse usage to improve performance, reliability, and user experience.</li>
        <li>Comply with legal obligations and payment partner requirements.</li>
      </ul>

      <LegalSection id="third-party">3. Third-party services</LegalSection>
      <p>
        We use trusted third-party providers to deliver {productName}. These providers process data
        only as needed to perform their services:
      </p>
      <ul>
        <li>
          <strong>Jitsi / 8x8 JaaS</strong> — real-time audio, video, and screen sharing for
          meetings.
        </li>
        <li>
          <strong>Railway</strong> — application hosting and database infrastructure.
        </li>
        <li>
          <strong>Vercel</strong> — optional frontend hosting and delivery (if used for deployment).
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery (login OTP and support messages).
        </li>
        <li>
          <strong>Razorpay</strong> — payment processing for BoldMeet Pro subscriptions.
        </li>
        <li>
          <strong>YouTube (Google)</strong> — optional Pro integration for live streaming and
          recording to your YouTube channel when you choose to use that feature.
        </li>
      </ul>
      <p>
        We do not sell your personal information to third parties. We share data with processors
        only under contractual obligations appropriate to their role.
      </p>

      <LegalSection id="data-retention">4. Data retention</LegalSection>
      <ul>
        <li>
          Account and billing records are retained while your account is active and for a reasonable
          period thereafter as required for legal, tax, and dispute resolution purposes.
        </li>
        <li>OTP verification records are retained only as long as needed for authentication.</li>
        <li>
          Meeting metadata may be retained to provide meeting history, billing support, and service
          improvement.
        </li>
        <li>
          Server logs are retained for a limited period for security and troubleshooting, then deleted
          or anonymised.
        </li>
      </ul>

      <LegalSection id="data-security">5. Data security</LegalSection>
      <p>
        We implement administrative, technical, and organisational measures to protect your
        information, including encryption in transit (HTTPS), secure session management, and access
        controls. No method of transmission or storage is 100% secure; we cannot guarantee absolute
        security.
      </p>

      <LegalSection id="your-rights">6. Your rights</LegalSection>
      <p>Subject to applicable law (including Indian data protection requirements), you may:</p>
      <ul>
        <li>Request access to personal data we hold about you.</li>
        <li>Request correction of inaccurate information.</li>
        <li>Request deletion of your account and associated data, subject to legal retention needs.</li>
        <li>Withdraw consent where processing is consent-based.</li>
        <li>Lodge a complaint with a relevant supervisory authority.</li>
      </ul>
      <p>
        To exercise these rights, contact us at{' '}
        <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
          {supportEmail}
        </a>{' '}
        or via our{' '}
        <Link href="/contact" className="text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>

      <LegalSection id="international-transfers">7. International transfers</LegalSection>
      <p>
        Your data may be processed on servers located in India or other countries where our service
        providers operate. We take steps to ensure appropriate safeguards when data is transferred
        internationally.
      </p>

      <LegalSection id="children">8. Children</LegalSection>
      <p>
        {productName} is not intended for users under 18 years of age. We do not knowingly collect
        personal information from children. Contact us if you believe a child has provided us data.
      </p>

      <LegalSection id="changes">9. Changes to this policy</LegalSection>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated version on
        this page with a revised &quot;Last updated&quot; date. Continued use of {productName} after
        changes constitutes acceptance of the updated policy.
      </p>

      <LegalSection id="contact">10. Contact us</LegalSection>
      <p>
        {companyName}
        <br />
        Product: {productName}
        <br />
        Website: {websiteUrl}
        <br />
        Email:{' '}
        <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
          {supportEmail}
        </a>
      </p>
    </LegalPageLayout>
  );
}
