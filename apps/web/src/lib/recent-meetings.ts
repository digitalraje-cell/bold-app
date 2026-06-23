export type RecentMeeting = {
  meetingCode: string;
  meetingName: string | null;
  joinedAt: string;
};

const STORAGE_KEY = 'bold:recent-meetings';
const MAX_RECENT = 5;

function migrateEntry(raw: unknown): RecentMeeting | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;
  const meetingCode = String(entry.meetingCode ?? entry.id ?? '').trim();
  if (!meetingCode) return null;

  const nameRaw = entry.meetingName ?? entry.title;
  const meetingName =
    typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : null;

  return {
    meetingCode,
    meetingName,
    joinedAt:
      typeof entry.joinedAt === 'string' ? entry.joinedAt : new Date().toISOString(),
  };
}

export function formatJoinedAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 60_000) return 'just now';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) {
    return `Joined ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Joined ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Joined ${days} day${days === 1 ? '' : 's'} ago`;
}

export function readRecentMeetings(): RecentMeeting[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(migrateEntry)
      .filter((item): item is RecentMeeting => item !== null)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentMeeting(
  entry: Pick<RecentMeeting, 'meetingCode'> &
    Partial<Pick<RecentMeeting, 'meetingName' | 'joinedAt'>>,
) {
  if (typeof window === 'undefined') return;

  const next: RecentMeeting = {
    meetingCode: entry.meetingCode,
    meetingName: entry.meetingName ?? null,
    joinedAt: entry.joinedAt ?? new Date().toISOString(),
  };

  const list = readRecentMeetings().filter(
    (item) => item.meetingCode !== next.meetingCode,
  );
  list.unshift(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}
