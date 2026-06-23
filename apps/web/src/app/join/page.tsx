import type { Metadata } from 'next';
import { PwaJoinHome } from '@/components/pwa/PwaJoinHome';
import { getServerAppOrigin } from '@/lib/urls';

const TITLE = 'Join or start a meeting | Bold';
const DESCRIPTION = 'Join a Bold video meeting with a code or link, or sign in to host a new meeting.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getServerAppOrigin()}/join` },
};

export const dynamic = 'force-dynamic';

export default function JoinHubPage() {
  return <PwaJoinHome />;
}
