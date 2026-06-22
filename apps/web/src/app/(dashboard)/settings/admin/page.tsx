import { isPlatformAdmin } from '@boldmeet/shared';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminSettings } from '@/components/settings/AdminSettings';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isPlatformAdmin(user?.role)) {
    redirect('/settings/account');
  }

  return <AdminSettings />;
}
