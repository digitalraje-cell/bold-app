import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminSettings } from '@/components/settings/AdminSettings';
import { redirect } from 'next/navigation';
import { resolveAdminAccess } from '@/lib/admin-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  const access = resolveAdminAccess(dbUser, session.user);
  if (!access.allowed) {
    redirect('/settings/account');
  }

  return <AdminSettings />;
}
