'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

type YoutubeStats = {
  channelsConnected: number;
  liveEnabledChannels: number;
  streamsCreated: number;
  activeStreams: number;
  hoursStreamed: number;
  recentStreams: Array<{
    id: string;
    meetingTitle: string;
    hostEmail: string;
    title: string | null;
    status: string;
    watchUrl: string | null;
    visibility: string;
    startedAt: string | null;
    endedAt: string | null;
  }>;
};

export default function AdminYoutubePage() {
  const [stats, setStats] = useState<YoutubeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api.admin.youtubeStats()) as YoutubeStats;
        setStats(data);
      } catch {
        setError('Unable to load YouTube Live stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">YouTube Live</h1>
      <p className="mt-1 text-muted-foreground">Channel connections, streams, and usage.</p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-sm text-destructive">{error}</p>
      ) : stats ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Channels connected', value: stats.channelsConnected },
              { label: 'Live-enabled channels', value: stats.liveEnabledChannels },
              { label: 'Streams created', value: stats.streamsCreated },
              { label: 'Active streams', value: stats.activeStreams },
              { label: 'Hours streamed', value: stats.hoursStreamed },
            ].map((item) => (
              <div key={item.label} className={cn(cardClass({ bordered: true }), 'p-5')}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Recent streams</h2>
            <div className="mt-4 space-y-3">
              {stats.recentStreams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No streams yet.</p>
              ) : (
                stats.recentStreams.map((stream) => (
                  <div key={stream.id} className={cn(cardClass({ bordered: true }), 'p-4')}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{stream.title ?? stream.meetingTitle}</p>
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                        {stream.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stream.hostEmail} · {stream.visibility.toLowerCase()}
                    </p>
                    {stream.watchUrl && (
                      <a
                        href={stream.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-foreground underline"
                      >
                        Watch URL
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
