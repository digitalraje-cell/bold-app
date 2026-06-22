import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { createLegalMetadata } from '@/lib/legal-metadata';
import { PLAN_PRICING_INR, SubscriptionPlan } from '@boldmeet/shared';

export const metadata: Metadata = createLegalMetadata({
  title: 'Refund Policy',
  description:
    'BoldMeet Pro refund and cancellation policy — ₹299/month subscription terms for Lifetop Academy SaaS billing via Razorpay.',
  path: '/refund',
});

export default function RefundPolicyPage() {
  const { productName, companyName, supportEmail } = LEGAL_CONFIG;
  const proPrice = PLAN_PRICING_INR[SubscriptionPlan.PRO];

  return (
    <LegalPageLayout title="Refund Policy">
      <p>
        This Refund Policy applies to paid subscriptions for {productName} Pro, operated by{' '}
        {companyName}. Payments are processed securely through Razorpay.
      </p>

      <h2>Plan covered</h2>
      <p>
        <strong>BoldMeet Pro</strong> — ₹{proPrice}/month
      </p>
      <p>
        Pro includes advanced features such as co-hosts, attendee management, YouTube Live
        integration, and related Pro capabilities as described on our{' '}
        <Link href="/#pricing" className="text-foreground underline-offset-4 hover:underline">
          pricing page
        </Link>
        .
      </p>

      <h2>Cancellation</h2>
      <ul>
        <li>
          <strong>You may cancel anytime.</strong> Contact support or manage your subscription
          through our billing flow to request cancellation.
        </li>
        <li>
          <strong>Active until period end.</strong> After cancellation, your Pro subscription
          remains active until the end of the current billing period for which payment was received.
        </li>
        <li>
          <strong>No partial refunds.</strong> We do not provide partial refunds for unused days or
          unused portions of a billing period once Pro access has been activated.
        </li>
      </ul>

      <h2>Refunds we may approve</h2>
      <ul>
        <li>
          <strong>Accidental duplicate payments</strong> — if you were charged twice for the same
          billing period, contact us with both transaction references. Duplicate charges will be
          reviewed and refunded where applicable.
        </li>
        <li>
          <strong>Technical billing disputes</strong> — if payment was successful but Pro was not
          activated and we cannot resolve the issue within a reasonable time, contact support with
          your Razorpay payment ID and account email.
        </li>
        <li>
          <strong>Material service failure</strong> — in rare cases where paid Pro features were
          unavailable for an extended period due to a fault on our side, we may offer a credit or
          refund at our discretion.
        </li>
      </ul>

      <h2>Non-refundable situations</h2>
      <ul>
        <li>Free plan usage.</li>
        <li>Pro access already consumed during the current billing period.</li>
        <li>Change of mind after Pro has been activated and used.</li>
        <li>Bank or payment network fees outside our control.</li>
      </ul>

      <h2>How to request a refund or report a billing issue</h2>
      <p>
        Email{' '}
        <a href={`mailto:${supportEmail}`} className="text-foreground underline-offset-4 hover:underline">
          {supportEmail}
        </a>{' '}
        or use our{' '}
        <Link href="/contact" className="text-foreground underline-offset-4 hover:underline">
          Contact form
        </Link>{' '}
        with:
      </p>
      <ul>
        <li>Your {productName} account email</li>
        <li>Date of payment</li>
        <li>Razorpay payment ID or receipt</li>
        <li>Description of the issue</li>
      </ul>
      <p>
        We aim to respond to billing inquiries within <strong>48 business hours</strong>. Approved
        refunds are processed through Razorpay to the original payment method within 5–10 business
        days, subject to bank processing times.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Refund Policy from time to time. The current version is always available
        at {productName} on this page.
      </p>
    </LegalPageLayout>
  );
}
