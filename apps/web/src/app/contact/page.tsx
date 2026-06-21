import Link from 'next/link';
import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';
import { APP_CONFIG } from '@/lib/app-config';

export default function ContactPage() {
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@bold.robozant.com';

  return (
    <LegalPageLayout title="Contact Us">
      <p>
        We&apos;re here to help with account access, billing, meetings, and Pro upgrades for{' '}
        {APP_CONFIG.name}.
      </p>

      <h2>Support email</h2>
      <p>
        <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
          {supportEmail}
        </a>
      </p>

      <h2>Billing &amp; Pro activation</h2>
      <p>
        After paying via Razorpay, include your account email and payment receipt if Pro is not
        activated within 24 hours. Visit{' '}
        <Link href="/billing" className="text-primary hover:underline">
          Billing &amp; Plans
        </Link>{' '}
        when signed in.
      </p>

      <h2>Business inquiries</h2>
      <p>For partnerships, enterprise plans, or custom branding, email us with your company name and requirements.</p>

      <h2>Response time</h2>
      <p>We typically respond within 1–2 business days.</p>
    </LegalPageLayout>
  );
}
