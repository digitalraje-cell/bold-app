import type { Metadata } from 'next';
import { PricingPageContent } from '@/components/marketing/PricingPageContent';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'Pricing | Bold';
const DESCRIPTION = 'Simple, transparent pricing for Bold video meetings — Free, Pro, and Max plans.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getServerAppOrigin()}/pricing` },
};

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  return <PricingPageContent />;
}
