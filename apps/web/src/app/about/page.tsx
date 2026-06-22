import type { Metadata } from 'next';
import { AboutContent } from '@/components/marketing/AboutContent';
import { fetchPlatformStatsServer } from '@/lib/platform-stats';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'About BoldMeet | Modern Video Meetings & Webinars';
const DESCRIPTION =
  'Learn about BoldMeet, our mission, founders and vision for the future of virtual meetings, webinars and online collaboration.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getServerAppOrigin()}/about` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${getServerAppOrigin()}/about`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const stats = await fetchPlatformStatsServer();

  return <AboutContent stats={stats} />;
}
