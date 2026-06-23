import { redirect } from 'next/navigation';
import { ADMIN_ROUTE_ALIASES } from '@/lib/route-access';

export const dynamic = 'force-dynamic';

export default function YouTubeLiveAliasPage() {
  redirect(ADMIN_ROUTE_ALIASES['/youtube-live']);
}
