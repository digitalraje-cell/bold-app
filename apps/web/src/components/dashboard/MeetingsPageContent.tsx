import { auth } from '@/lib/auth';
import { loadUserMeetings } from '@/lib/dashboard-meetings';
import { MeetingListSection } from '@/components/dashboard/MeetingCard';
import { ui } from '@/lib/ui';

export async function MeetingsPageContent() {
  const session = await auth();
  const userId = session?.user?.id;
  const { live, upcoming, past } = await loadUserMeetings(userId);

  return (
    <>
      <div className="mb-10">
        <h1 className={ui.pageTitle}>Meetings</h1>
        <p className={ui.pageSubtitle}>Live, upcoming, and past meetings.</p>
      </div>

      <div className="space-y-8">
        <MeetingListSection
          title="Live Now"
          icon="radio"
          meetings={live}
          emptyMessage="No live meetings"
          currentUserId={userId}
        />
        <MeetingListSection
          title="Upcoming"
          icon="calendar"
          meetings={upcoming}
          emptyMessage="No upcoming meetings"
          currentUserId={userId}
        />
        <MeetingListSection
          title="Past Meetings"
          icon="history"
          meetings={past}
          emptyMessage="No past meetings"
          currentUserId={userId}
        />
      </div>
    </>
  );
}
