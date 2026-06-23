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
import {
  logYouTubePipeline,
  logYouTubePipelineError,
} from '@/lib/youtube-live-pipeline-log';

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

type StreamStartApiResponse = StreamSession & {
  ingestToken?: string;
  streamId?: string;
  sessions?: Array<
    Partial<StreamSession> & {
      streamId?: string;
      token?: string;
    }
  >;
  data?: StreamStartApiResponse;
};

/** Map stream/start API body → relay sessions with id + ingestToken for Socket.IO. */
function normalizeStreamStartResponse(response: StreamStartApiResponse): StreamSession[] {
  console.log('stream start response', response);

  const body =
    response && typeof response === 'object' && response.data && typeof response.data === 'object'
      ? response.data
      : response;

  const rootId = body.id ?? body.streamId;
  const rootToken = body.ingestToken;

  const rawSessions =
    Array.isArray(body.sessions) && body.sessions.length > 0 ? body.sessions : [body];

  return rawSessions
    .map((raw, index) => {
      const item = raw as Partial<StreamSession> & { streamId?: string; token?: string };
      const streamId = item.id ?? item.streamId ?? rootId;
      const ingestToken = item.ingestToken ?? item.token ?? rootToken;

      if (!streamId || !ingestToken) {
        console.error('[youtube-live] missing ingest credentials for session', {
          index,
          item,
          rootId,
          hasRootToken: Boolean(rootToken),
        });
      }

      return {
        id: String(streamId ?? ''),
        ingestToken: String(ingestToken ?? ''),
        watchUrl: item.watchUrl ?? body.watchUrl ?? null,
        channelName: item.channelName ?? null,
        youtubeAccountId: item.youtubeAccountId ?? null,
        title: item.title ?? body.title ?? null,
        startedAt: item.startedAt ?? body.startedAt ?? null,
        status: item.status ?? body.status,
        viewerCount: item.viewerCount ?? null,
      };
    })
    .filter((session) => session.id && session.ingestToken);
}

function deriveDisplayStatus(input: {
  broadcastStatus: BroadcastStatus;
  connectionState: StreamConnectionState;
  captureActive: boolean;
  relayActive: boolean;
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
  if (input.broadcastStatus === 'LIVE' && input.relayActive) {
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
  relayActive: boolean,
): 'healthy' | 'degraded' | 'offline' {
  if (connectionState === 'connected' && captureActive) return 'healthy';
  if (relayActive && !captureActive) return 'degraded';
  if (connectionState === 'connecting') return 'degraded';
  if (connectionState === 'error') return 'degraded';
  return 'offline';
}

async function requestDisplayCapture(): Promise<MediaStream> {
  logYouTubePipeline('STAGE-1-BROWSER', 'getDisplayMedia:request');
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true,
      // @ts-expect-error preferCurrentTab is supported in Chromium for meeting-tab capture
      preferCurrentTab: true,
    });
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    logYouTubePipeline('STAGE-1-BROWSER', 'getDisplayMedia:success', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      videoLabel: videoTrack?.label ?? null,
      videoReadyState: videoTrack?.readyState ?? null,
      audioLabel: audioTrack?.label ?? null,
      audioReadyState: audioTrack?.readyState ?? null,
    });
    logYouTubePipeline('STAGE-1-BROWSER', 'camera-stream:acquired', {
      note: 'This is the display/tab capture stream used for YouTube ingest (not the Jitsi camera preview)',
    });
    return stream;
  } catch (error) {
    logYouTubePipelineError('STAGE-1-BROWSER', 'getDisplayMedia:failure', error);
    throw error;
  }
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
  const [relayActive, setRelayActive] = useState(false);
  const [captureActive, setCaptureActive] = useState(false);
  const [pendingResume, setPendingResume] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const socketsRef = useRef<Socket[]>([]);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const stopLiveRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => undefined);
  const streamSessionIdRef = useRef<string | null>(null);
  const serverStreamActiveRef = useRef(false);
  const stoppingRef = useRef(false);
  const attachingRef = useRef(false);
  const startingRef = useRef(false);
  const resumingRef = useRef(false);

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
      relayActive?: boolean;
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
      if (state.relayActive !== undefined) setRelayActive(state.relayActive);
      if (state.viewerCount !== undefined) setViewerCount(state.viewerCount);
      if (state.visibility !== undefined) setStreamVisibility(state.visibility);
    },
    [],
  );

  const attachCaptureAndSockets = useCallback(
    async (sessions: StreamSession[], existingStream?: MediaStream) => {
      if (sessions.length === 0) {
        throw new Error('No stream sessions to attach');
      }
      if (attachingRef.current) {
        throw new Error('Screen capture is already in progress');
      }
      attachingRef.current = true;
      streamSessionIdRef.current = sessions[0]!.id;
      setConnectionState('connecting');
      setError(null);

      try {
        const displayStream = existingStream ?? (await requestDisplayCapture());
        captureStreamRef.current = displayStream;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

        logYouTubePipeline('STAGE-1-BROWSER', 'media-recorder:created', {
          mimeType,
          videoBitsPerSecond: 2_500_000,
        });

        const recorder = new MediaRecorder(displayStream, {
          mimeType,
          videoBitsPerSecond: 2_500_000,
        });
        recorderRef.current = recorder;

        const socketOrigin = getSocketOrigin();
        const socketUrl = `${socketOrigin}/stream`;
        logYouTubePipeline('STAGE-2-SOCKET', 'socket:url-resolved', {
          socketOrigin,
          socketUrl,
          webPageOrigin: typeof window !== 'undefined' ? window.location.origin : null,
          namespace: '/stream',
          transport: 'websocket',
          sessionCount: sessions.length,
          streamIds: sessions.map((s) => s.id),
        });
        logYouTubePipeline('STAGE-2-SOCKET', 'socket:connecting');

        const sockets = sessions.map((session) => {
          const streamId = session.id;
          const ingestToken = session.ingestToken;

          console.log('socket connect payload', { streamId, ingestToken });

          const socket = io(socketUrl, {
            query: { streamId, token: ingestToken },
            auth: { streamId, token: ingestToken },
            transports: ['websocket'],
          });

          console.log('socket query/auth', socket.io.opts);
          return { socket, streamId };
        });
        socketsRef.current = sockets.map((entry) => entry.socket);

        let connectedCount = 0;
        let chunksEmitted = 0;
        const requiredConnections = sockets.length;

        const tryStartRecorder = () => {
          if (connectedCount < requiredConnections) return;
          if (recorder.state !== 'inactive') return;
          try {
            recorder.start(1000);
            logYouTubePipeline('STAGE-1-BROWSER', 'media-recorder:started', {
              state: recorder.state,
              timesliceMs: 1000,
              mimeType: recorder.mimeType,
            });
            setCaptureActive(true);
            setPendingResume(false);
            setConnectionState('connected');
          } catch (err) {
            logYouTubePipelineError('STAGE-1-BROWSER', 'media-recorder:start-failed', err);
            const message = err instanceof Error ? err.message : 'Could not start media capture';
            setConnectionState('error');
            setError(formatYouTubeLiveUserError(err, 'youtube-live:recorder'));
            throw err instanceof Error ? err : new Error(message);
          }
        };

        recorder.ondataavailable = async (event) => {
          if (event.data.size === 0) return;
          const chunk = event.data;
          console.log('[chunk emit]', {
            size: chunk?.size,
            type: chunk?.type,
            constructor: chunk?.constructor?.name,
          });
          chunksEmitted += 1;
          const bytes = new Uint8Array(await event.data.arrayBuffer());
          if (chunksEmitted === 1) {
            logYouTubePipeline('STAGE-1-BROWSER', 'media-recorder:first-chunk', {
              chunkNumber: 1,
              bytes: bytes.byteLength,
              type: event.data.type,
            });
          } else if (chunksEmitted % 10 === 0) {
            logYouTubePipeline('STAGE-1-BROWSER', 'media-recorder:chunk-progress', {
              chunkNumber: chunksEmitted,
              bytes: bytes.byteLength,
            });
          }
          let socketsConnected = 0;
          for (const socket of socketsRef.current) {
            if (socket.connected) {
              socketsConnected += 1;
              console.log('[chunk emit] socket payload', {
                event: 'ingest-chunk',
                payload: bytes,
                byteLength: bytes.byteLength,
                constructor: bytes.constructor?.name,
              });
              socket.emit('ingest-chunk', bytes);
            }
          }
          if (chunksEmitted === 1) {
            logYouTubePipeline('STAGE-2-SOCKET', 'socket:first-chunk-emitted', {
              bytes: bytes.byteLength,
              socketsConnected,
              socketsTotal: socketsRef.current.length,
            });
          }
        };

        for (const { socket, streamId: sessionStreamId } of sockets) {
          socket.io.on('reconnect_attempt', (attempt) => {
            logYouTubePipeline('STAGE-2-SOCKET', 'socket:reconnect-attempt', {
              attempt,
              streamId: sessionStreamId,
            });
          });

          socket.io.on('reconnect_error', (err) => {
            logYouTubePipelineError('STAGE-2-SOCKET', 'socket:reconnect-error', err, {
              streamId: sessionStreamId,
            });
          });

          socket.io.on('reconnect_failed', () => {
            logYouTubePipeline('STAGE-2-SOCKET', 'socket:reconnect-failed', {
              streamId: sessionStreamId,
            });
          });

          socket.on('connect', () => {
            connectedCount += 1;
            logYouTubePipeline('STAGE-2-SOCKET', 'socket:connected', {
              socketId: socket.id,
              connectedCount,
              requiredConnections,
              streamId: sessionStreamId,
              transport: socket.io.engine?.transport?.name ?? 'unknown',
            });
            tryStartRecorder();
          });

          socket.on('disconnect', (reason) => {
            logYouTubePipeline('STAGE-2-SOCKET', 'socket:disconnected', {
              reason,
              streamId: sessionStreamId,
            });
            setConnectionState('disconnected');
            setCaptureActive(false);
          });

          socket.on('connect_error', (err) => {
            logYouTubePipelineError('STAGE-2-SOCKET', 'socket:connect-error', err, {
              socketOrigin,
              socketUrl,
              streamId: sessionStreamId,
            });
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
        setRelayActive(true);
        setPendingResume(false);
      } finally {
        attachingRef.current = false;
      }
    },
    [applyStreamState, startedAt],
  );

  const stopLive = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isYouTubeLiveEnabled() || stoppingRef.current) return;
      stoppingRef.current = true;
      if (!options?.silent) setStopping(true);
      cleanupCapture();
      setPendingResume(false);

      const shouldStopOnServer =
        serverStreamActiveRef.current || Boolean(streamSessionIdRef.current);

      try {
        if (shouldStopOnServer || broadcastStatus === 'LIVE' || broadcastStatus === 'ERROR') {
          const result = (await api.stream.stop(meetingId)) as { status?: BroadcastStatus };
          serverStreamActiveRef.current = false;
          streamSessionIdRef.current = null;
          applyStreamState({
            status: result.status ?? 'ENDED',
            startedAt: null,
            canResume: false,
            viewerCount: null,
            destinations: [],
            relayActive: false,
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
        streamSessionIdRef.current = null;
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
      startingRef.current = true;
      setPendingResume(false);
      let startedOnServer = false;
      let pendingCapture: MediaStream | null = null;
      try {
        pendingCapture = await requestDisplayCapture();
        logYouTubePipeline('STAGE-1-BROWSER', 'api:stream.start:request', { meetingId });
        const session = (await api.stream.start(meetingId, params)) as StreamStartApiResponse;
        startedOnServer = true;
        serverStreamActiveRef.current = true;
        const relaySessions = normalizeStreamStartResponse(session);
        if (relaySessions.length === 0) {
          throw new Error('Stream started but ingest credentials were missing from the API response.');
        }
        logYouTubePipeline('STAGE-1-BROWSER', 'api:stream.start:success', {
          streamId: relaySessions[0]!.id,
          sessionCount: relaySessions.length,
          hasIngestToken: Boolean(relaySessions[0]!.ingestToken),
        });
        await attachCaptureAndSockets(relaySessions, pendingCapture);
        pendingCapture = null;
        return session;
      } catch (err) {
        pendingCapture?.getTracks().forEach((track) => track.stop());
        cleanupCapture();
        if (startedOnServer) {
          serverStreamActiveRef.current = false;
          streamSessionIdRef.current = null;
          await api.stream.stop(meetingId).catch(() => undefined);
        }
        const message = formatYouTubeLiveUserError(err, 'youtube-live:start');
        setError(message);
        setBroadcastStatus('ERROR');
        throw new Error(message);
      } finally {
        startingRef.current = false;
        setStarting(false);
      }
    },
    [meetingId, cleanupCapture, attachCaptureAndSockets],
  );

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
        applyStreamState({ status: 'IDLE', canResume: false, relayActive: false });
        return;
      }

      const needsResume = Boolean(
        session.status === 'LIVE' &&
          session.canResume &&
          !captureActive &&
          !recorderRef.current &&
          !startingRef.current &&
          !resumingRef.current &&
          !attachingRef.current,
      );

      applyStreamState({
        status: session.status,
        watchUrl: session.watchUrl,
        title: session.title,
        startedAt: session.startedAt,
        viewerCount: session.viewerCount,
        visibility: session.visibility,
        destinations: session.destinations,
        relayActive: session.relayActive,
        canResume: needsResume,
      });
      setPendingResume(needsResume);

      if (session.status === 'LIVE') {
        serverStreamActiveRef.current = true;
        if (session.relayActive) {
          setRelayActive(true);
        }
      }

      if (session.status === 'ERROR') {
        setError('YouTube Live session ended due to a relay error.');
      }
    } catch {
      // Guests and non-moderators cannot load moderator stream state
    }
  }, [meetingId, applyStreamState, captureActive]);

  const resumeLive = useCallback(async () => {
    if (!isYouTubeLiveEnabled()) return;
    setError(null);
    setResuming(true);
    resumingRef.current = true;
    let pendingCapture: MediaStream | null = null;
    try {
      pendingCapture = await requestDisplayCapture();
      const session = (await api.stream.resume(meetingId)) as StreamStartApiResponse;
      const relaySessions = normalizeStreamStartResponse(session);
      if (relaySessions.length === 0) {
        throw new Error('Stream resumed but ingest credentials were missing from the API response.');
      }
      await attachCaptureAndSockets(relaySessions, pendingCapture);
      pendingCapture = null;
      serverStreamActiveRef.current = true;
      return session;
    } catch (err) {
      pendingCapture?.getTracks().forEach((track) => track.stop());
      cleanupCapture();
      const raw = err instanceof Error ? err.message : '';
      if (/no active youtube live session to resume/i.test(raw)) {
        setPendingResume(false);
        setError(null);
        await loadModeratorState();
        return;
      }
      const message = formatYouTubeLiveUserError(err, 'youtube-live:resume');
      setError(message);
      setBroadcastStatus('ERROR');
      setPendingResume(false);
      throw new Error(message);
    } finally {
      resumingRef.current = false;
      setResuming(false);
    }
  }, [meetingId, cleanupCapture, attachCaptureAndSockets, loadModeratorState]);

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
            relayActive?: boolean;
          };
          if (data.viewerCount !== undefined) setViewerCount(data.viewerCount);
          if (data.watchUrl) setWatchUrl(data.watchUrl);
          if (data.visibility) setStreamVisibility(data.visibility);
          if (data.destinations) setDestinations(data.destinations);
          if (data.relayActive !== undefined) setRelayActive(data.relayActive);
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
        relayActive,
        starting,
        resuming,
      }),
    [broadcastStatus, connectionState, captureActive, relayActive, starting, resuming],
  );

  const streamHealth = useMemo(
    () => deriveStreamHealth(connectionState, captureActive, relayActive),
    [connectionState, captureActive, relayActive],
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
