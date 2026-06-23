import { redirect } from 'next/navigation';
import { ADMIN_ROUTE_ALIASES } from '@/lib/route-access';

export const dynamic = 'force-dynamic';

export default function AdminPaymentsAliasPage() {
  redirect(ADMIN_ROUTE_ALIASES['/admin-payments']);
}
