import { redirect } from 'next/navigation';
import { ADMIN_ROUTE_ALIASES } from '@/lib/route-access';

export const dynamic = 'force-dynamic';

export default function AdminUsersAliasPage() {
  redirect(ADMIN_ROUTE_ALIASES['/admin-users']);
}
