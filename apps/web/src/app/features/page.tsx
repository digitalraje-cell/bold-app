import type { Metadata } from 'next';
import { FeaturesContent } from '@/components/marketing/FeaturesContent';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'Features | Bold';
const DESCRIPTION =
  'HD video meetings, YouTube Live streaming, co-hosts, webinar mode, and host controls — all in your browser.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getServerAppOrigin()}/features` },
};

export const dynamic = 'force-dynamic';

export default function FeaturesPage() {
  return <FeaturesContent />;
}
