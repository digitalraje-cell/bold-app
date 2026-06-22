'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type AdminMeeting = {
  id: string;
  meetingCode: string;
  title: string;
  hostId: string;
  hostName: string | null;
  hostEmail: string | null;
  status: string;
  roomMode: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  _count: { participants: number };
};

type ActiveParticipant = {
  id: string;
  displayName: string;
  role: string;
  status: string;
  joinedAt: string;
  meeting: {
    id: string;
    meetingCode: string;
    title: string;
    hostName: string | null;
    hostEmail: string | null;
    status: string;
  };
};

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<AdminMeeting[]>([]);
  const [participants, setParticipants] = useState<ActiveParticipant[]>([]);
  const [recordings, setRecordings] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      api.admin.listMeetings({ search: search || undefined }),
      api.admin.listActiveParticipants(),
      api.admin.listRecordings(),
    ])
      .then(([meetingsRes, participantsRes, recordingsRes]) => {
        setMeetings(meetingsRes as AdminMeeting[]);
        setParticipants(participantsRes as ActiveParticipant[]);
        setRecordings(recordingsRes as Array<Record<string, unknown>>);
      })
      .catch(() => setError('Unable to load meetings data.'));
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Meetings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All meetings, active participants, and recordings.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search meetings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <section className="overflow-x-auto rounded-2xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">All Meetings</h3>
        </div>
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2">Meeting</th>
              <th className="px-4 py-2">Host</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Participants</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">{meeting.meetingCode}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{meeting.hostName || '—'}</p>
                  <p className="text-xs text-muted-foreground">{meeting.hostEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      meeting.status === 'LIVE'
                        ? 'bg-green-500/10 text-green-700'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {meeting.status}
                  </span>
                </td>
                <td className="px-4 py-3">{meeting._count.participants}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(meeting.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Active Participants</h3>
        </div>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2">Participant</th>
              <th className="px-4 py-2">Meeting</th>
              <th className="px-4 py-2">Host</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.displayName}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{p.meeting.title}</p>
                  <Link
                    href={`/join/${p.meeting.meetingCode}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {p.meeting.meetingCode}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.meeting.hostName || p.meeting.hostEmail}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.joinedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Recordings</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2">Provider</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Meeting</th>
              <th className="px-4 py-2">Watch</th>
            </tr>
          </thead>
          <tbody>
            {recordings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                  No recordings yet.
                </td>
              </tr>
            ) : (
              recordings.map((rec) => (
                <tr key={String(rec.id)} className="border-t border-border">
                  <td className="px-4 py-3">{String(rec.provider ?? '—')}</td>
                  <td className="px-4 py-3">{String(rec.status ?? '—')}</td>
                  <td className="px-4 py-3">{String(rec.meetingId ?? '—')}</td>
                  <td className="px-4 py-3">
                    {rec.watchUrl ? (
                      <a
                        href={String(rec.watchUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
