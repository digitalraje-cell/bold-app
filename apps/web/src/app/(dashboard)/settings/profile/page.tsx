import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/layout/AppShell';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true, createdAt: true },
  });

  if (!user) redirect('/login');

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account information</p>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-sm">
                {user.isVerified ? (
                  <span className="text-green-600">Verified User ✓</span>
                ) : (
                  <span className="text-amber-600">Unverified — verify to host meetings</span>
                )}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-border pt-6">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Member since</dt>
              <dd className="mt-1">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
