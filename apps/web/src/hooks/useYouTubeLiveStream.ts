'use client';

import { useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  BroadcastStatus,
  MeetingBroadcastProviderType,
} from '@boldmeet/shared';
import { api } from '@/lib/api';
import { getSocketOrigin } from '@/lib/api-base';
import { isYouTubeLiveEnabled } from '@/lib/features';

export type StartLiveStreamParams = {
  provider: MeetingBroadcastProviderType;
  title: string;
  rtmpUrl?: string;
  streamKey: string;
  watchUrl?: string;
};

export function useYouTubeLiveStream(meetingId: string) {
  const [isLive, setIsLive] = useState(false);
  const [streamStatus, setStreamStatus] = useState<BroadcastStatus>('IDLE');
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const stopLiveRef = useRef<() => Promise<void>>(async () => undefined);

  const cleanupCapture = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    captureStreamRef.current?.getTracks().forEach((track) => track.stop());
    captureStreamRef.current = null;
  }, []);

  const applyStreamState = useCallback(
    (state: {
      isLive?: boolean;
      status?: BroadcastStatus;
      watchUrl?: string | null;
      title?: string | null;
      startedAt?: string | null;
    }) => {
      if (state.status) setStreamStatus(state.status);
      if (state.isLive !== undefined) setIsLive(state.isLive);
      if (state.watchUrl !== undefined) setWatchUrl(state.watchUrl);
      if (state.title !== undefined) setStreamTitle(state.title);
      if (state.startedAt !== undefined) setStartedAt(state.startedAt);
      if (state.status === 'LIVE' || state.isLive) {
        setIsLive(true);
        setStreamStatus('LIVE');
      }
      if (state.status === 'ENDED' || state.status === 'IDLE') {
        if (!recorderRef.current) {
          setIsLive(false);
        }
      }
    },
    [],
  );

  const startLive = useCallback(
    async (params: StartLiveStreamParams) => {
      if (!isYouTubeLiveEnabled()) return;
      setError(null);
      setStarting(true);
      try {
        const session = (await api.stream.start(meetingId, params)) as {
          id: string;
          ingestToken: string;
          watchUrl?: string | null;
          title?: string | null;
          startedAt?: string | null;
          status?: BroadcastStatus;
        };

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });
        captureStreamRef.current = displayStream;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

        const recorder = new MediaRecorder(displayStream, {
          mimeType,
          videoBitsPerSecond: 2_500_000,
        });
        recorderRef.current = recorder;

        const socket = io(`${getSocketOrigin()}/stream`, {
          query: { streamId: session.id, token: session.ingestToken },
          transports: ['websocket'],
        });
        socketRef.current = socket;

        recorder.ondataavailable = async (event) => {
          if (event.data.size === 0 || !socket.connected) return;
          const bytes = new Uint8Array(await event.data.arrayBuffer());
          socket.emit('ingest-chunk', bytes);
        };

        socket.on('connect', () => {
          recorder.start(1000);
        });

        socket.on('connect_error', () => {
          setError('Could not connect media relay. Check your connection and try again.');
        });

        displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
          void stopLiveRef.current();
        });

        applyStreamState({
          isLive: true,
          status: session.status ?? 'LIVE',
          watchUrl: session.watchUrl,
          title: session.title ?? params.title,
          startedAt: session.startedAt ?? new Date().toISOString(),
        });
      } catch (err) {
        cleanupCapture();
        const message = err instanceof Error ? err.message : 'Failed to start YouTube Live';
        setError(message);
        throw err;
      } finally {
        setStarting(false);
      }
    },
    [meetingId, cleanupCapture, applyStreamState],
  );

  const stopLive = useCallback(async () => {
    if (!isYouTubeLiveEnabled()) return;
    setStopping(true);
    try {
      cleanupCapture();
      const result = (await api.stream.stop(meetingId)) as { status?: BroadcastStatus };
      applyStreamState({
        isLive: false,
        status: result.status ?? 'ENDED',
        startedAt: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop YouTube Live';
      setError(message);
    } finally {
      setStopping(false);
    }
  }, [meetingId, cleanupCapture, applyStreamState]);

  stopLiveRef.current = stopLive;

  const loadModeratorState = useCallback(async () => {
    if (!isYouTubeLiveEnabled()) return;
    try {
      const session = (await api.stream.get(meetingId)) as {
        status?: BroadcastStatus;
        watchUrl?: string | null;
        title?: string | null;
        startedAt?: string | null;
      } | null;
      if (session) {
        applyStreamState({
          isLive: session.status === 'LIVE',
          status: session.status,
          watchUrl: session.watchUrl,
          title: session.title,
          startedAt: session.startedAt,
        });
      }
    } catch {
      // Guests and non-moderators cannot load moderator stream state
    }
  }, [meetingId, applyStreamState]);

  return {
    isLive,
    streamStatus,
    watchUrl,
    streamTitle,
    startedAt,
    starting,
    stopping,
    error,
    startLive,
    stopLive,
    applyStreamState,
    loadModeratorState,
    setError,
  };
}
