import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!user?.isActive || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Super Admin</p>
        <h1 className="text-2xl font-bold">BoldMeet Admin</h1>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
