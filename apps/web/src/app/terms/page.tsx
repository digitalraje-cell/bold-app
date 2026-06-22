import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LegalSection } from '@/components/marketing/LegalSection';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';
import { getPublicDisplayUrl } from '@/lib/public-display';
import { PLAN_PRICING_INR, SubscriptionPlan } from '@boldmeet/shared';

const TERMS_SECTIONS = [
  { id: 'service', title: 'Service description' },
  { id: 'eligibility', title: 'Eligibility and accounts' },
  { id: 'responsibilities', title: 'User responsibilities' },
  { id: 'conduct', title: 'Meeting conduct' },
  { id: 'prohibited', title: 'Prohibited activities' },
  { id: 'billing', title: 'Subscriptions and billing' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'availability', title: 'Service availability' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'termination', title: 'Account termination' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'governing-law', title: 'Governing law' },
  { id: 'contact', title: 'Contact' },
] as const;

export const metadata: Metadata = createLegalMetadata({
  title: 'Terms of Service',
  description:
    'Bold Terms of Service — rules for using Lifetop Academy video meetings, webinars, recordings, and Pro subscriptions.',
  path: '/terms',
});

export default function TermsPage() {
  const { productName, companyName, supportEmail, governingLaw } = LEGAL_CONFIG;
  const websiteUrl = getPublicDisplayUrl();

  return (
    <LegalPageLayout
      title="Terms of Service"
      description="The rules governing your use of Bold meetings, webinars, recordings, and subscriptions."
      sections={[...TERMS_SECTIONS]}
    >
      <p className="legal-lead">
        These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between
        you and {companyName} (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;) governing your
        access to and use of {productName} ({websiteUrl}), including our video conferencing, online
        meeting, webinar, recording, and SaaS subscription services.
      </p>
      <p>
        By accessing or using {productName}, creating an account, or purchasing a subscription, you
        agree to these Terms. If you do not agree, do not use the service.
      </p>

      <LegalSection id="service" title="1. Service description">
        <p>
          {productName} is a browser-based platform that enables users to host and join online
          meetings, use chat, screen sharing, raise hand, reactions, and (on eligible plans) advanced
          features such as co-hosting, attendee management, YouTube Live integration, and recording
          capabilities. Features available to you depend on your subscription plan (Free or Pro).
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility and accounts">
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>
            You must provide a valid email address and complete OTP verification to sign in and host
            meetings.
          </li>
          <li>
            You are responsible for all activity under your account and for maintaining the security of
            your session.
          </li>
          <li>You must provide accurate information and promptly update it if it changes.</li>
          <li>
            Guest participants may join meetings without an account when permitted by the meeting host.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="responsibilities" title="3. User responsibilities">
        <ul>
          <li>Use {productName} only for lawful purposes and in compliance with these Terms.</li>
          <li>Ensure you have necessary rights and consents for content you share in meetings.</li>
          <li>Obtain participant consent before recording or streaming meetings where required by law.</li>
          <li>Configure meeting settings (passcodes, waiting rooms) appropriate to your use case.</li>
          <li>Do not share login codes or attempt to access another user&apos;s account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="conduct" title="4. Meeting conduct">
        <p>When hosting or participating in meetings, you agree to:</p>
        <ul>
          <li>Respect other participants and maintain professional conduct.</li>
          <li>Not harass, threaten, defame, or discriminate against others.</li>
          <li>Not share unlawful, obscene, or infringing content.</li>
          <li>Not disrupt meetings through spam, abuse of chat, or technical interference.</li>
        </ul>
        <p>
          Hosts are responsible for managing their meetings and participants to the extent permitted by
          the platform.
        </p>
      </LegalSection>

      <LegalSection id="prohibited" title="5. Prohibited activities">
        <p>You may not:</p>
        <ul>
          <li>Use the service for illegal activity, fraud, or impersonation.</li>
          <li>Attempt to gain unauthorised access to systems, accounts, or data.</li>
          <li>Reverse engineer, scrape, or overload the platform except as permitted by law.</li>
          <li>Resell, white-label, or commercially exploit the service without written consent.</li>
          <li>Circumvent plan limits, billing, or security controls.</li>
          <li>Use the service to transmit malware or conduct denial-of-service attacks.</li>
        </ul>
      </LegalSection>

      <LegalSection id="billing" title="6. Subscriptions and billing">
        <p>
          <strong>Bold Pro</strong> is offered at ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month
          unless otherwise stated on our pricing page. Payments are processed by Razorpay. By
          upgrading, you authorise charges for the selected plan.
        </p>
        <ul>
          <li>Pro features are activated after payment verification; manual activation may apply during early launch.</li>
          <li>Plan features, limits, and pricing may change with notice on our website.</li>
          <li>
            Refunds are governed by our <Link href="/refund">Refund Policy</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ip" title="7. Intellectual property">
        <ul>
          <li>
            {productName}, its software, branding, documentation, and underlying technology are owned
            by {companyName} or its licensors.
          </li>
          <li>
            You retain ownership of content you create or upload. You grant us a limited licence to
            host, transmit, and display that content solely to provide the service.
          </li>
          <li>Feedback you provide may be used by us without obligation to you.</li>
        </ul>
      </LegalSection>

      <LegalSection id="availability" title="8. Service availability">
        <p>
          We strive to maintain reliable service but do not guarantee uninterrupted or error-free
          operation. Maintenance, third-party outages (including media, payment, or email providers),
          and factors outside our control may affect availability. We may modify, suspend, or
          discontinue features with reasonable notice where practicable.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, {productName} is provided &quot;as
          is&quot; and &quot;as available&quot; without warranties of any kind, whether express or
          implied. {companyName} shall not be liable for indirect, incidental, special, consequential,
          or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the
          service.
        </p>
        <p>
          Our total liability for any claim relating to the service shall not exceed the amount you
          paid to us in the twelve (12) months preceding the claim, or ₹
          {PLAN_PRICING_INR[SubscriptionPlan.PRO]}, whichever is greater.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="10. Account termination">
        <ul>
          <li>You may stop using the service and sign out at any time.</li>
          <li>
            We may suspend or terminate your account if you violate these Terms, abuse the platform, or
            as required by law.
          </li>
          <li>
            Upon termination, your right to access the service ceases. Provisions that by nature should
            survive (including liability limits and governing law) will survive.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="privacy" title="11. Privacy">
        <p>
          Our collection and use of personal information is described in our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="12. Governing law">
        <p>
          These Terms are governed by the laws of {governingLaw}, without regard to conflict of law
          principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of
          competent jurisdiction in {governingLaw}.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <p>
          Questions about these Terms:{' '}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a> ·{' '}
          <Link href="/contact">Contact Us</Link>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
