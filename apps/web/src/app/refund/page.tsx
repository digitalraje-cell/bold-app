import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { APP_CONFIG } from '@/lib/app-config';
import { PLAN_PRICING_INR, SubscriptionPlan } from '@boldmeet/shared';

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <p>
        This Refund Policy applies to Pro subscription payments made through {APP_CONFIG.name} via
        Razorpay.
      </p>

      <h2>Pro plan (₹{PLAN_PRICING_INR[SubscriptionPlan.PRO]}/month)</h2>
      <ul>
        <li>
          Pro access is activated manually after payment verification during the early founder launch
          period.
        </li>
        <li>
          If payment was successful but Pro was not activated within 48 hours, contact support with
          your payment receipt for resolution.
        </li>
        <li>
          Refund requests must be submitted within 7 days of payment for unused Pro access in the
          current billing period.
        </li>
      </ul>

      <h2>Eligible refunds</h2>
      <p>We may issue a full or partial refund when:</p>
      <ul>
        <li>Duplicate payment was charged in error.</li>
        <li>Pro was not activated despite successful payment and support could not resolve within 48 hours.</li>
        <li>Service was materially unavailable for an extended period affecting paid features.</li>
      </ul>

      <h2>Non-refundable</h2>
      <ul>
        <li>Free plan usage.</li>
        <li>Pro periods already consumed or activated more than 7 days prior to the request.</li>
        <li>Third-party fees charged by payment providers outside our control.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email{' '}
        <Link href="/contact" className="text-primary hover:underline">
          support
        </Link>{' '}
        with your account email, payment date, Razorpay payment ID, and reason for the request. We
        aim to respond within 3 business days.
      </p>

      <h2>Processing</h2>
      <p>
        Approved refunds are processed through Razorpay to the original payment method within 5–10
        business days, subject to bank processing times.
      </p>
    </LegalPageLayout>
  );
}
