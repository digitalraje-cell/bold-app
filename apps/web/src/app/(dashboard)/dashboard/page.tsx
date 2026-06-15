import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { Video, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your meetings and join calls instantly.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/meetings/create?type=instant"
            className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary">Instant Meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a meeting right now
            </p>
          </Link>

          <Link
            href="/meetings/create?type=schedule"
            className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold group-hover:text-primary">Schedule Meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan a meeting for later
            </p>
          </Link>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Join Meeting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a meeting code to join
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-4 text-lg font-semibold">Upcoming Meetings</h2>
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No upcoming meetings</p>
              <Link
                href="/meetings/create"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Schedule your first meeting
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
