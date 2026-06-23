import type { Metadata } from 'next';
import { LandingPageContent } from '@/components/marketing/LandingPageContent';
import { MARKETING_COPY } from '@/lib/marketing-copy';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'Bold — Meet, Present & Stream in One Platform';
const DESCRIPTION = MARKETING_COPY.metaDescription;

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
