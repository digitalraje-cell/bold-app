import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@boldmeet/shared';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  if (!isPlatformAdmin(user?.role, user?.email)) {
    redirect('/dashboard');
  }

  return children;
}
