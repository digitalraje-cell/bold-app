import type { Metadata } from 'next';
import { LandingPageContent } from '@/components/marketing/LandingPageContent';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'Bold — Browser-based video meetings';
const DESCRIPTION =
  'Host HD video calls, stream to YouTube, and collaborate in your browser — no download required.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getServerAppOrigin()}/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${getServerAppOrigin()}/`,
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default function RootPage() {
  return <LandingPageContent />;
}
