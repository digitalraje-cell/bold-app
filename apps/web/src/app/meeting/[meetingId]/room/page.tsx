'use client';

import Link from 'next/link';

export default function MeetingRoomPage({ params }: { params: { meetingId: string } }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-900 px-6 text-white">
      <h1 className="text-xl font-semibold">Meeting Room</h1>
      <p className="mt-2 text-slate-400">
        Jitsi integration coming in Phase 4
      </p>
      <p className="mt-1 font-mono text-sm text-slate-500">{params.meetingId}</p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
      >
        Leave meeting
      </Link>
    </div>
  );
}
