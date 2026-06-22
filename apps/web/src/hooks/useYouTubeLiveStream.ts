'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  BroadcastStatus,
  LiveStreamDestinationView,
  StreamConnectionState,
  StreamDisplayStatus,
  YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { MeetingBroadcastProviderType } from '@boldmeet/shared';
import { api } from '@/lib/api';
import { getSocketOrigin } from '@/lib/api-base';
import { isYouTubeLiveEnabled } from '@/lib/features';
import { formatYouTubeLiveUserError } from '@/lib/youtube-live-errors';

export type StartLiveStreamParams = {
  provider: MeetingBroadcastProviderType;
  youtubeAccountIds: string[];
  visibility?: YouTubePrivacyStatus;
};

type StreamSession = {
  id: string;
  ingestToken: string;
  watchUrl?: string | null;
  channelName?: string | null;
  youtubeAccountId?: string | null;
  title?: string | null;
  startedAt?: string | null;
  status?: BroadcastStatus;
  viewerCount?: number | null;
};

const RECONNECT_WINDOW_MS = 60_000;
const RECONNECT_INTERVAL_MS = 5_000;

function deriveDisplayStatus(input: {
  broadcastStatus: BroadcastStatus;
  connectionState: StreamConnectionState;
  captureActive: boolean;
  starting: boolean;
  resuming: boolean;
}): StreamDisplayStatus {
  if (input.broadcastStatus === 'ERROR') return 'ERROR';
  if (input.starting || input.resuming || input.connectionState === 'connecting') {
    return 'CONNECTING';
  }
  if (
    input.broadcastStatus === 'LIVE' &&
    input.captureActive &&
    input.connectionState === 'connected'
  ) {
    return 'LIVE';
  }
  if (input.broadcastStatus === 'LIVE' && !input.captureActive) {
    return 'CONNECTING';
  }
  return 'OFFLINE';
}

function deriveStreamHealth(
  connectionState: StreamConnectionState,
  captureActive: boolean,
): 'healthy' | 'degraded' | 'offline' {
  if (connectionState === 'connected' && captureActive) return 'healthy';
  if (connectionState === 'connecting') return 'degraded';
  if (connectionState === 'error') return 'degraded';
  return 'offline';
}

export function useYouTubeLiveStream(meetingId: string) {
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus>('IDLE');
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<LiveStreamDestinationView[]>([]);
  const [streamTitle, setStreamTitle] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [streamVisibility, setStreamVisibility] = useState<YouTubePrivacyStatus | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('disconnected');
  const [captureActive, setCaptureActive] = useState(false);
  const [pendingResume, setPendingResume] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const socketsRef = useRef<Socket[]>([]);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const stopLiveRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => undefined);
  const resumeLiveRef = useRef<() => Promise<unknown>>(async () => undefined);
  const streamSessionIdRef = useRef<string | null>(null);
  const stoppingRef = useRef(false);
  const reconnectStartedAtRef = useRef<number | null>(null);

  const cleanupCapture = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    for (const socket of socketsRef.current) {
      socket.disconnect();
    }
    socketsRef.current = [];
    captureStreamRef.current?.getTracks().forEach((track) => track.stop());
    captureStreamRef.current = null;
    setCaptureActive(false);
    setConnectionState('disconnected');
  }, []);

  const applyStreamState = useCallback(
    (state: {
      status?: BroadcastStatus;
      watchUrl?: string | null;
      title?: string | null;
      startedAt?: string | null;
      canResume?: boolean;
      viewerCount?: number | null;
      visibility?: YouTubePrivacyStatus | null;
      destinations?: LiveStreamDestinationView[];
    }) => {
      if (state.status) setBroadcastStatus(state.status);
      if (state.watchUrl !== undefined) setWatchUrl(state.watchUrl);
      if (state.destinations !== undefined) setDestinations(state.destinations);
      if (state.title !== undefined) setStreamTitle(state.title);
      if (state.startedAt !== undefined) setStartedAt(state.startedAt);
      if (state.canResume !== undefined) setPendingResume(state.canResume);
      if (state.viewerCount !== undefined) setViewerCount(state.viewerCount);
      if (state.visibility !== undefined) setStreamVisibility(state.visibility);
    },
    [],
  );

  const attachCaptureAndSockets = useCallback(
    async (sessions: StreamSession[]) => {
      if (sessions.length === 0) {
        throw new Error('No stream sessions to attach');
      }
      streamSessionIdRef.current = sessions[0]!.id;
      reconnectStartedAtRef.current = null;
      setConnectionState('connecting');
      setError(null);

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

      const sockets = sessions.map(
        (session) =>
          io(`${getSocketOrigin()}/stream`, {
            query: { streamId: session.id, token: session.ingestToken },
            transports: ['websocket'],
          }),
      );
      socketsRef.current = sockets;

      let connectedCount = 0;
      const requiredConnections = sockets.length;

      const tryStartRecorder = () => {
        if (connectedCount < requiredConnections) return;
        if (recorder.state === 'inactive') {
          recorder.start(1000);
          setCaptureActive(true);
          setPendingResume(false);
          setConnectionState('connected');
        }
      };

      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;
        const bytes = new Uint8Array(await event.data.arrayBuffer());
        for (const socket of socketsRef.current) {
          if (socket.connected) {
            socket.emit('ingest-chunk', bytes);
          }
        }
      };

      for (const socket of sockets) {
        socket.on('connect', () => {
          connectedCount += 1;
          tryStartRecorder();
        });

        socket.on('disconnect', () => {
          setConnectionState('disconnected');
          setCaptureActive(false);
        });

        socket.on('connect_error', () => {
          setConnectionState('error');
          setError('Could not connect media relay. Check your connection and try again.');
        });
      }

      displayStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        void stopLiveRef.current();
      });

      const primary = sessions[0]!;
      const dests: LiveStreamDestinationView[] = sessions.map((s) => ({
        id: s.id,
        youtubeAccountId: s.youtubeAccountId ?? null,
        channelName: s.channelName ?? null,
        watchUrl: s.watchUrl ?? null,
        status: (s.status ?? 'LIVE') as BroadcastStatus,
        viewerCount: s.viewerCount ?? null,
      }));

      applyStreamState({
        status: primary.status ?? 'LIVE',
        watchUrl: primary.watchUrl,
        title: primary.title,
        startedAt: primary.startedAt ?? startedAt,
        viewerCount: primary.viewerCount,
        canResume: false,
        destinations: dests,
      });
      setBroadcastStatus('LIVE');
    },
    [applyStreamState, startedAt],
  );

  const stopLive = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isYouTubeLiveEnabled() || stoppingRef.current) return;
      stoppingRef.current = true;
      reconnectStartedAtRef.current = null;
      if (!options?.silent) setStopping(true);
      cleanupCapture();
      streamSessionIdRef.current = null;
      setPendingResume(false);

      try {
        if (broadcastStatus === 'LIVE' || broadcastStatus === 'ERROR') {
          const result = (await api.stream.stop(meetingId)) as { status?: BroadcastStatus };
          applyStreamState({
            status: result.status ?? 'ENDED',
            startedAt: null,
            canResume: false,
            viewerCount: null,
            destinations: [],
          });
        } else {
          setBroadcastStatus('ENDED');
          setStartedAt(null);
          setViewerCount(null);
        }
      } catch (err) {
        if (!options?.silent) {
          setError(formatYouTubeLiveUserError(err, 'youtube-live:stop'));
        }
      } finally {
        stoppingRef.current = false;
        if (!options?.silent) setStopping(false);
      }
    },
    [meetingId, cleanupCapture, applyStreamState, broadcastStatus],
  );

  stopLiveRef.current = stopLive;

  const startLive = useCallback(
    async (params: StartLiveStreamParams) => {
      if (!isYouTubeLiveEnabled()) return;
      setError(null);
      setStarting(true);
      try {
        const session = (await api.stream.start(meetingId, params)) as StreamSession & {
          ingestToken: string;
          sessions?: StreamSession[];
        };
        const relaySessions =
          session.sessions && session.sessions.length > 0
            ? session.sessions
            : [{ ...session, ingestToken: session.ingestToken }];
        await attachCaptureAndSockets(relaySessions);
        return session;
      } catch (err) {
        cleanupCapture();
        const message = formatYouTubeLiveUserError(err, 'youtube-live:start');
        setError(message);
        setBroadcastStatus('ERROR');
        throw new Error(message);
      } finally {
        setStarting(false);
      }
    },
    [meetingId, cleanupCapture, attachCaptureAndSockets],
  );

  const resumeLive = useCallback(async () => {
    if (!isYouTubeLiveEnabled()) return;
    setError(null);
    setResuming(true);
    try {
      const session = (await api.stream.resume(meetingId)) as StreamSession & {
        ingestToken: string;
        sessions?: StreamSession[];
      };
      const relaySessions =
        session.sessions && session.sessions.length > 0
          ? session.sessions
          : [{ ...session, ingestToken: session.ingestToken }];
      await attachCaptureAndSockets(relaySessions);
      return session;
    } catch (err) {
      cleanupCapture();
      const message = formatYouTubeLiveUserError(
        err,
        'youtube-live:resume',
      );
      setError(message);
      setBroadcastStatus('ERROR');
      setPendingResume(false);
      throw new Error(message);
    } finally {
      setResuming(false);
    }
  }, [meetingId, cleanupCapture, attachCaptureAndSockets]);

  resumeLiveRef.current = resumeLive;

  const loadModeratorState = useCallback(async () => {
    if (!isYouTubeLiveEnabled()) return;
    try {
      const session = (await api.stream.get(meetingId)) as {
        status?: BroadcastStatus;
        watchUrl?: string | null;
        title?: string | null;
        startedAt?: string | null;
        canResume?: boolean;
        relayActive?: boolean;
        viewerCount?: number | null;
        visibility?: YouTubePrivacyStatus | null;
        destinations?: LiveStreamDestinationView[];
      } | null;

      if (!session) {
        applyStreamState({ status: 'IDLE', canResume: false });
        return;
      }

      const needsResume = Boolean(
        session.status === 'LIVE' && session.canResume && !captureActive && !recorderRef.current,
      );

      applyStreamState({
        status: session.status,
        watchUrl: session.watchUrl,
        title: session.title,
        startedAt: session.startedAt,
        viewerCount: session.viewerCount,
        visibility: session.visibility,
        destinations: session.destinations,
        canResume: needsResume,
      });
      setPendingResume(needsResume);

      if (session.status === 'ERROR') {
        setError('YouTube Live session ended due to a relay error.');
      }
    } catch {
      // Guests and non-moderators cannot load moderator stream state
    }
  }, [meetingId, applyStreamState, captureActive]);

  useEffect(() => {
    if (!pendingResume || captureActive) return;

    if (!reconnectStartedAtRef.current) {
      reconnectStartedAtRef.current = Date.now();
    }

    const attemptReconnect = () => {
      const started = reconnectStartedAtRef.current ?? Date.now();
      if (Date.now() - started > RECONNECT_WINDOW_MS) {
        void stopLiveRef.current({ silent: true });
        setPendingResume(false);
        setError('Could not reconnect YouTube Live. The broadcast was ended.');
        return;
      }
      void resumeLiveRef.current().catch(() => undefined);
    };

    attemptReconnect();
    const timer = window.setInterval(attemptReconnect, RECONNECT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pendingResume, captureActive]);

  useEffect(() => {
    if (!startedAt || broadcastStatus !== 'LIVE') {
      setElapsedSeconds(0);
      return;
    }
    const startMs = new Date(startedAt).getTime();
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, broadcastStatus]);

  useEffect(() => {
    if (broadcastStatus !== 'LIVE') return;
    const poll = () => {
      void api.stream
        .get(meetingId)
        .then((session) => {
          const data = session as {
            viewerCount?: number | null;
            watchUrl?: string | null;
            visibility?: YouTubePrivacyStatus | null;
            destinations?: LiveStreamDestinationView[];
          };
          if (data.viewerCount !== undefined) setViewerCount(data.viewerCount);
          if (data.watchUrl) setWatchUrl(data.watchUrl);
          if (data.visibility) setStreamVisibility(data.visibility);
          if (data.destinations) setDestinations(data.destinations);
        })
        .catch(() => undefined);
    };
    poll();
    const id = window.setInterval(poll, 15_000);
    return () => window.clearInterval(id);
  }, [broadcastStatus, meetingId]);

  useEffect(() => {
    const onPageHide = () => {
      if (captureActive) {
        cleanupCapture();
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      if (captureActive) {
        cleanupCapture();
      }
    };
  }, [captureActive, cleanupCapture]);

  const displayStatus = useMemo(
    () =>
      deriveDisplayStatus({
        broadcastStatus,
        connectionState,
        captureActive,
        starting,
        resuming,
      }),
    [broadcastStatus, connectionState, captureActive, starting, resuming],
  );

  const streamHealth = useMemo(
    () => deriveStreamHealth(connectionState, captureActive),
    [connectionState, captureActive],
  );

  const isLive = displayStatus === 'LIVE';

  return {
    isLive,
    broadcastStatus,
    displayStatus,
    connectionState,
    streamHealth,
    watchUrl,
    destinations,
    streamTitle,
    viewerCount,
    streamVisibility,
    startedAt,
    elapsedSeconds,
    starting,
    resuming,
    stopping,
    error,
    pendingResume,
    captureActive,
    startLive,
    resumeLive,
    stopLive,
    applyStreamState,
    loadModeratorState,
    setError,
  };
}
