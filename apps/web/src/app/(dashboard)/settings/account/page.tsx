import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlan: true,
      createdAt: true,
      isVerified: true,
    },
  });

  if (!user) redirect('/login');

  return (
    <AccountSettings
      plan={user.subscriptionPlan}
      createdAt={user.createdAt.toISOString()}
      isVerified={user.isVerified}
    />
  );
}
