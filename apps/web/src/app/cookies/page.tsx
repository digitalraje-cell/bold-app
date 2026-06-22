import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LegalSection } from '@/components/marketing/LegalSection';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';
import { getPublicDisplayDomain } from '@/lib/public-display';

const COOKIE_SECTIONS = [
  { id: 'what', title: 'What are cookies?' },
  { id: 'how', title: 'How we use cookies' },
  { id: 'third-party', title: 'Third-party cookies' },
  { id: 'managing', title: 'Managing cookies' },
  { id: 'updates', title: 'Updates' },
  { id: 'contact', title: 'Contact' },
] as const;

export const metadata: Metadata = createLegalMetadata({
  title: 'Cookie Policy',
  description:
    'Bold Cookie Policy — how Lifetop Academy uses essential, authentication, analytics, and session cookies on bold.robozant.com.',
  path: '/cookies',
});

export default function CookiePolicyPage() {
  const { productName, companyName, supportEmail } = LEGAL_CONFIG;
  const websiteDomain = getPublicDisplayDomain();

  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="How Bold uses cookies and similar technologies for authentication, sessions, and service delivery."
      sections={[...COOKIE_SECTIONS]}
    >
      <p className="legal-lead">
        This Cookie Policy explains how {companyName} (&quot;we&quot;, &quot;us&quot;) uses cookies
        and similar technologies on {productName} ({websiteDomain}).
      </p>
      <p>
        For broader information about how we handle personal data, see our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <LegalSection id="what" title="What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a website. They help
          websites function, remember preferences, and understand how services are used.
        </p>
      </LegalSection>

      <LegalSection id="how" title="How we use cookies">
        <h3>Essential cookies</h3>
        <p>
          These cookies are required for {productName} to operate. They enable core functionality
          such as security, load balancing, and remembering your preferences during a session. You
          cannot opt out of essential cookies while using the service.
        </p>

        <h3>Authentication cookies</h3>
        <p>
          When you sign in with email OTP, we use session cookies and secure tokens to keep you
          logged in and to protect your account. These cookies identify your authenticated session
          and expire after a defined period or when you sign out.
        </p>

        <h3>Session management cookies</h3>
        <p>
          We use cookies to maintain your session state as you navigate between pages (e.g.
          dashboard, meetings, billing). This ensures a consistent experience without requiring you
          to sign in on every page.
        </p>

        <h3>Analytics cookies</h3>
        <p>
          We may use analytics cookies or similar technologies to understand how users interact with{' '}
          {productName} — for example, which features are used and how the platform performs. This
          helps us improve reliability and user experience. Analytics data is generally aggregated
          and does not directly identify you unless combined with account information you have
          provided.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="Third-party cookies">
        <p>
          Some cookies may be set by third-party services integrated into {productName}, such as:
        </p>
        <ul>
          <li>
            <strong>Payment providers (Razorpay)</strong> — when you complete a Pro subscription
            payment.
          </li>
          <li>
            <strong>Media providers (Jitsi / 8x8 JaaS)</strong> — when you join a meeting room.
          </li>
        </ul>
        <p>
          These third parties have their own cookie policies. We encourage you to review their
          policies where applicable.
        </p>
      </LegalSection>

      <LegalSection id="managing" title="Managing cookies">
        <p>
          Most browsers allow you to block or delete cookies through settings. If you disable
          essential or authentication cookies, parts of {productName} — including sign-in and
          meetings — may not function correctly.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="Updates">
        <p>
          We may update this Cookie Policy from time to time. Changes will be posted on this page
          with an updated &quot;Last updated&quot; date.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions about cookies: <a href={`mailto:${supportEmail}`}>{supportEmail}</a> ·{' '}
          <Link href="/contact">Contact Us</Link>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
