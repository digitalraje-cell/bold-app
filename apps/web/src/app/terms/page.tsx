import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { APP_CONFIG } from '@/lib/app-config';
import { PLAN_PRICING_INR, SubscriptionPlan } from '@boldmeet/shared';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of {APP_CONFIG.name} meeting
        services. By creating an account or using the service, you agree to these Terms.
      </p>

      <h2>Service description</h2>
      <p>
        {APP_CONFIG.name} provides browser-based video meetings, chat, screen sharing, and related
        collaboration tools. Features may vary by subscription plan (Free or Pro).
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must provide accurate registration information and keep credentials secure.</li>
        <li>You are responsible for activity under your account.</li>
        <li>We may suspend accounts that violate these Terms or applicable law.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to use the service to:</p>
      <ul>
        <li>Transmit unlawful, harmful, or infringing content.</li>
        <li>Disrupt meetings or attempt unauthorized access to systems.</li>
        <li>Resell or misrepresent the service without written permission.</li>
      </ul>

      <h2>Subscriptions and billing</h2>
      <p>
        Pro plan is billed at ₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month unless otherwise stated.
        Payments are processed by Razorpay. Pro access may require manual verification after payment
        during early launch. See our{' '}
        <Link href="/refund" className="text-primary hover:underline">
          Refund Policy
        </Link>
        .
      </p>

      <h2>Intellectual property</h2>
      <p>
        The platform, branding, and software are owned by {APP_CONFIG.name}. You retain ownership of
        content you share in meetings.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of uninterrupted availability.
        We are not liable for indirect damages to the extent permitted by law.
      </p>

      <h2>Governing law</h2>
      <p>These Terms are governed by the laws of India. Disputes shall be subject to the courts of competent jurisdiction in India.</p>
    </LegalPageLayout>
  );
}
