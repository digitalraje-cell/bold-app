'use client';

import { useState } from 'react';
import {
  DEFAULT_YOUTUBE_RTMP_URL,
  MeetingBroadcastProviderType,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { StartLiveStreamParams } from '@/hooks/useYouTubeLiveStream';

interface YouTubeLiveModalProps {
  open: boolean;
  defaultTitle: string;
  loading?: boolean;
  onClose: () => void;
  onStart: (params: StartLiveStreamParams) => Promise<void>;
}

export function YouTubeLiveModal({
  open,
  defaultTitle,
  loading,
  onClose,
  onStart,
}: YouTubeLiveModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [rtmpUrl, setRtmpUrl] = useState(DEFAULT_YOUTUBE_RTMP_URL);
  const [streamKey, setStreamKey] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await onStart({
        provider: MeetingBroadcastProviderType.YOUTUBE_RTMP,
        title: title.trim() || defaultTitle,
        rtmpUrl: rtmpUrl.trim() || DEFAULT_YOUTUBE_RTMP_URL,
        streamKey: streamKey.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start YouTube Live');
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Start YouTube Live
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Paste your YouTube Studio stream key. Bold relays this meeting to YouTube — the replay
          is saved on your channel automatically. You stay in Bold; viewers watch on YouTube.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Stream title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">YouTube stream key</label>
            <Input
              type="password"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="Paste from YouTube Studio → Go live"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              RTMP URL <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              value={rtmpUrl}
              onChange={(e) => setRtmpUrl(e.target.value)}
              placeholder={DEFAULT_YOUTUBE_RTMP_URL}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            After starting, share this Bold meeting tab and enable &quot;Share tab audio&quot; so
            YouTube viewers hear the meeting.
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !streamKey.trim()}>
              {loading ? 'Starting…' : 'Start YouTube Live'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
