import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { APP_CONFIG } from '@/lib/app-config';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        {APP_CONFIG.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a browser-based
        meeting platform. This Privacy Policy explains how we collect, use, and protect your
        information when you use our services.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information: name, email address, and one-time login codes.</li>
        <li>Meeting data: meeting titles, participant display names, and usage metrics.</li>
        <li>Payment information: processed by Razorpay; we store payment status and plan records, not card numbers.</li>
        <li>Technical data: browser type, IP address, and service logs for security and reliability.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>Provide and improve meeting, chat, and collaboration features.</li>
        <li>Process subscriptions and send service-related communications.</li>
        <li>Prevent fraud, abuse, and unauthorized access.</li>
        <li>Comply with applicable law and payment partner requirements.</li>
      </ul>

      <h2>Data sharing</h2>
      <p>
        We use infrastructure and payment providers (including Railway, Razorpay, and 8x8 JaaS for
        media) to deliver the service. We do not sell your personal data to third parties.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain account and billing records while your account is active and as required for legal
        and tax purposes. You may request account deletion by contacting support.
      </p>

      <h2>Your rights</h2>
      <p>
        You may access, correct, or delete your personal data subject to applicable law. Contact us
        at{' '}
        <Link href="/contact" className="text-primary hover:underline">
          our support page
        </Link>
        .
      </p>

      <h2>Changes</h2>
      <p>We may update this policy from time to time. Continued use of the service constitutes acceptance of the updated policy.</p>
    </LegalPageLayout>
  );
}
