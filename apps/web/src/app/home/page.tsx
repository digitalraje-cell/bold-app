import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** PWA manifest start_url — forwards to the canonical join hub. */
export default function PwaHomePage() {
  redirect('/join');
}
