'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getMeetingMediaProvider } from '@/lib/media';

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiExternalAPI;
  }
}

interface JitsiExternalAPI {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
  getParticipantsInfo?: () => Array<{ participantId: string; displayName?: string }>;
}

export type JitsiRosterParticipant = {
  id: string;
  displayName: string;
};

interface UseJitsiOptions {
  roomName: string;
  jitsiDomain?: string;
  scriptUrl?: string;
  displayName: string;
  isHost?: boolean;
  isModerator?: boolean;
  jwt?: string | null;
  jwtEnabled?: boolean;
  moderatorPassword?: string | null;
  enabled?: boolean;
  allowDesktopSharing?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
  onLeave?: () => void;
  onMediaError?: (message: string) => void;
  onScreenShareChange?: (active: boolean) => void;
  onPresenterLayoutChange?: (active: boolean) => void;
  startMuted?: boolean;
  startVideoMuted?: boolean;
}

let jitsiScriptPromise: Promise<void> | null = null;
const MAX_RECONNECT_ATTEMPTS = 4;
const RECONNECT_DELAY_MS = 2000;

const BOLD_MEDIA_ERROR =
  'Unable to connect to meeting audio and video. Please try again or rejoin from the lobby.';

/** Jitsi auth/promo destinations — do NOT match bare "8x8" (legitimate meet.jit.si URLs include it). */
const EXTERNAL_NAV_PATTERNS = [
  '/login',
  '/oauth',
  '/auth',
  '/promo',
  'jaas',
  'grantmoderator',
];

function loadJitsiScript(url: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.JitsiMeetExternalAPI) return Promise.resolve();

  if (jitsiScriptPromise) return jitsiScriptPromise;

  jitsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Jitsi script')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi script'));
    document.body.appendChild(script);
  });

  return jitsiScriptPromise;
}

function looksLikeExternalJitsiNavigation(src: string): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  return EXTERNAL_NAV_PATTERNS.some((pattern) => lower.includes(pattern));
}

function applyInitialMediaState(
  api: JitsiExternalAPI,
  wantsAudio: boolean,
  wantsVideo: boolean,
) {
  window.setTimeout(() => {
    try {
      api.executeCommand('setAudioMuted', !wantsAudio);
    } catch {
      // Older Jitsi builds may not support setAudioMuted
    }
    try {
      api.executeCommand('setVideoMuted', !wantsVideo);
    } catch {
      // Older Jitsi builds may not support setVideoMuted
    }
  }, 600);
}

function claimJitsiModerator(
  api: JitsiExternalAPI,
  opts: {
    isHost: boolean;
    isModerator: boolean;
    jwtEnabled: boolean;
    moderatorPassword: string | null;
  },
) {
  if (opts.jwtEnabled) {
    return;
  }

  if (!opts.isHost && !opts.isModerator) return;

  try {
    api.executeCommand('toggleLobby', false);
  } catch {
    // lobby disabled in config
  }

  if (opts.moderatorPassword) {
    try {
      api.executeCommand('password', opts.moderatorPassword);
    } catch {
      // dev fallback only
    }
  }
}

export function useJitsi({
  roomName,
  jitsiDomain,
  scriptUrl,
  displayName,
  isHost = false,
  isModerator = false,
  jwt = null,
  jwtEnabled = false,
  moderatorPassword = null,
  enabled = true,
  allowDesktopSharing = true,
  containerRef,
  onReady,
  onLeave,
  onMediaError,
  onScreenShareChange,
  onPresenterLayoutChange,
  startMuted = false,
  startVideoMuted = false,
}: UseJitsiOptions) {
  const apiRef = useRef<JitsiExternalAPI | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const intentionalLeaveRef = useRef(false);
  const authErrorRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeObserverRef = useRef<MutationObserver | null>(null);
  const joinedRef = useRef(false);
  const disposingRef = useRef(false);
  const reconnectScheduledRef = useRef(false);
  const callbacksRef = useRef({
    onReady,
    onLeave,
    onMediaError,
    onScreenShareChange,
    onPresenterLayoutChange,
  });
  const optionsRef = useRef({
    displayName,
    isHost,
    isModerator,
    allowDesktopSharing,
    startMuted,
    startVideoMuted,
    jwt,
    jwtEnabled,
    moderatorPassword,
  });

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onLeave,
      onMediaError,
      onScreenShareChange,
      onPresenterLayoutChange,
    };
    optionsRef.current = {
      displayName,
      isHost,
      isModerator,
      allowDesktopSharing,
      startMuted,
      startVideoMuted,
      jwt,
      jwtEnabled,
      moderatorPassword,
    };
  }, [
    onReady,
    onLeave,
    onMediaError,
    onScreenShareChange,
    onPresenterLayoutChange,
    displayName,
    isHost,
    isModerator,
    allowDesktopSharing,
    startMuted,
    startVideoMuted,
    jwt,
    jwtEnabled,
    moderatorPassword,
  ]);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPresenterLayout, setIsPresenterLayout] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(startMuted);
  const [isVideoMuted, setIsVideoMuted] = useState(startVideoMuted);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [jitsiParticipants, setJitsiParticipants] = useState<JitsiRosterParticipant[]>([]);
  const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(null);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [localParticipantId, setLocalParticipantId] = useState<string | null>(null);

  const disposeSession = useCallback(() => {
    iframeObserverRef.current?.disconnect();
    iframeObserverRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (apiRef.current) {
      disposingRef.current = true;
      try {
        apiRef.current.dispose();
      } finally {
        apiRef.current = null;
        disposingRef.current = false;
      }
    }
    sessionKeyRef.current = null;
    joinedRef.current = false;
  }, []);

  const reportMediaError = useCallback(
    (message: string) => {
      if (authErrorRef.current) return;
      authErrorRef.current = true;
      intentionalLeaveRef.current = true;
      disposeSession();
      callbacksRef.current.onMediaError?.(message);
    },
    [disposeSession],
  );

  const scheduleReconnect = useCallback(() => {
    if (
      intentionalLeaveRef.current ||
      authErrorRef.current ||
      disposingRef.current ||
      reconnectScheduledRef.current ||
      !enabled ||
      !roomName
    ) {
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      reportMediaError(BOLD_MEDIA_ERROR);
      return;
    }

    reconnectScheduledRef.current = true;
    reconnectAttemptsRef.current += 1;
    setIsReconnecting(true);

    disposeSession();
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      reconnectScheduledRef.current = false;
      setIsReconnecting(false);
      setReconnectNonce((n) => n + 1);
    }, RECONNECT_DELAY_MS);
  }, [enabled, roomName, disposeSession, reportMediaError]);

  useEffect(() => {
    if (!enabled || !roomName) return;
    if (jwtEnabled && !jwt) return;

    if (reconnectTimerRef.current) {
      return;
    }

    const sessionKey = `${roomName}:${jwt ?? 'open'}:${moderatorPassword ?? 'none'}`;
    if (apiRef.current && sessionKeyRef.current === sessionKey) return;

    if (apiRef.current) {
      disposeSession();
    }

    let cancelled = false;
    intentionalLeaveRef.current = false;
    authErrorRef.current = false;
    const provider = getMeetingMediaProvider();
    const mediaDomain = jitsiDomain ?? provider.getDefaultDomain();
    const resolvedScriptUrl = scriptUrl ?? provider.getExternalApiScriptUrl(mediaDomain);

    const watchIframe = () => {
      if (!containerRef.current || cancelled) return;
      const iframe = containerRef.current.querySelector('iframe');
      if (!iframe) return;

      const checkSrc = () => {
        if (!joinedRef.current || disposingRef.current) return;
        const src = iframe.getAttribute('src') ?? '';
        if (looksLikeExternalJitsiNavigation(src)) {
          reportMediaError(BOLD_MEDIA_ERROR);
        }
      };

      iframeObserverRef.current?.disconnect();
      iframeObserverRef.current = new MutationObserver(checkSrc);
      iframeObserverRef.current.observe(iframe, { attributes: true, attributeFilter: ['src'] });
      checkSrc();
    };

    const initJitsi = () => {
      if (cancelled || apiRef.current || !containerRef.current) return;

      const opts = optionsRef.current;
      const embed = provider.buildEmbedOptions({
        roomName,
        displayName: opts.displayName,
        isHost: opts.isHost,
        isModerator: opts.isModerator,
        allowDesktopSharing: opts.allowDesktopSharing,
        startAudioMuted: opts.startMuted,
        startVideoMuted: opts.startVideoMuted,
        jwt: opts.jwt,
        jwtEnabled: opts.jwtEnabled,
      });

      const apiOptions: Record<string, unknown> = {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: embed.configOverwrite,
        interfaceConfigOverwrite: embed.interfaceConfigOverwrite,
        userInfo: embed.userInfo,
      };

      if (opts.jwt) {
        apiOptions.jwt = opts.jwt;
      }

      const api = new window.JitsiMeetExternalAPI(mediaDomain, apiOptions);

      api.addListener('videoConferenceJoined', (payload: unknown) => {
        joinedRef.current = true;
        reconnectAttemptsRef.current = 0;
        setIsReconnecting(false);
        const joined = payload as { id?: string; displayName?: string };
        if (joined.id) {
          setLocalParticipantId(joined.id);
          setJitsiParticipants((prev) => {
            const existing = prev.find((p) => p.id === joined.id);
            if (existing) return prev;
            return [
              ...prev,
              { id: joined.id!, displayName: joined.displayName?.trim() || 'You' },
            ];
          });
        }
        claimJitsiModerator(api, {
          isHost: opts.isHost,
          isModerator: opts.isModerator,
          jwtEnabled: opts.jwtEnabled,
          moderatorPassword: opts.moderatorPassword,
        });
        applyInitialMediaState(api, !opts.startMuted, !opts.startVideoMuted);
        watchIframe();
        callbacksRef.current.onReady?.();
      });

      api.addListener('readyToClose', () => {
        intentionalLeaveRef.current = true;
        callbacksRef.current.onLeave?.();
      });

      api.addListener('videoConferenceLeft', () => {
        if (disposingRef.current || intentionalLeaveRef.current || authErrorRef.current) {
          return;
        }
        if (joinedRef.current) {
          scheduleReconnect();
        }
      });

      api.addListener('connectionFailed', () => {
        if (disposingRef.current) return;
        if (opts.jwtEnabled) {
          reportMediaError(BOLD_MEDIA_ERROR);
          return;
        }
        if (joinedRef.current) {
          scheduleReconnect();
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS - 1) {
          reportMediaError(BOLD_MEDIA_ERROR);
        } else {
          scheduleReconnect();
        }
      });

      api.addListener('errorOccurred', () => {
        if (disposingRef.current) return;
        if (opts.jwtEnabled) {
          reportMediaError(BOLD_MEDIA_ERROR);
          return;
        }
        if (joinedRef.current) {
          scheduleReconnect();
        }
      });

      api.addListener('audioMuteStatusChanged', (payload: unknown) => {
        const { muted } = payload as { muted?: boolean };
        if (typeof muted === 'boolean') setIsAudioMuted(muted);
      });

      api.addListener('videoMuteStatusChanged', (payload: unknown) => {
        const { muted } = payload as { muted?: boolean };
        if (typeof muted === 'boolean') setIsVideoMuted(muted);
      });

      api.addListener('loginRequired', () => {
        reportMediaError(BOLD_MEDIA_ERROR);
      });

      api.addListener('passwordRequired', () => {
        reportMediaError(BOLD_MEDIA_ERROR);
      });

      api.addListener('screenSharingStatusChanged', (payload: unknown) => {
        const { on: sharing } = payload as { on?: boolean };
        const active = Boolean(sharing);
        setIsScreenSharing(active);
        callbacksRef.current.onScreenShareChange?.(active);
      });

      api.addListener('tileViewChanged', (payload: unknown) => {
        const { enabled: tileView } = payload as { enabled?: boolean };
        const presenter = !tileView;
        setIsPresenterLayout(presenter);
        callbacksRef.current.onPresenterLayoutChange?.(presenter);
      });

      api.addListener('participantJoined', (payload: unknown) => {
        const joined = payload as { id?: string; displayName?: string };
        if (!joined.id) return;
        setJitsiParticipants((prev) => {
          if (prev.some((p) => p.id === joined.id)) return prev;
          return [
            ...prev,
            { id: joined.id!, displayName: joined.displayName?.trim() || 'Participant' },
          ];
        });
      });

      api.addListener('participantLeft', (payload: unknown) => {
        const left = payload as { id?: string };
        if (!left.id) return;
        setJitsiParticipants((prev) => prev.filter((p) => p.id !== left.id));
        setDominantSpeakerId((current) => (current === left.id ? null : current));
        setPinnedParticipantId((current) => (current === left.id ? null : current));
      });

      api.addListener('displayNameChanged', (payload: unknown) => {
        const changed = payload as { id?: string; displayname?: string; displayName?: string };
        if (!changed.id) return;
        const name = (changed.displayname ?? changed.displayName)?.trim();
        if (!name) return;
        setJitsiParticipants((prev) =>
          prev.map((p) => (p.id === changed.id ? { ...p, displayName: name } : p)),
        );
      });

      api.addListener('dominantSpeakerChanged', (payload: unknown) => {
        const speaker = payload as { id?: string };
        setDominantSpeakerId(speaker.id ?? null);
      });

      api.addListener('pinParticipantChanged', (payload: unknown) => {
        const pin = payload as { participantId?: string | null };
        setPinnedParticipantId(pin.participantId ?? null);
      });

      apiRef.current = api;
      sessionKeyRef.current = sessionKey;
    };

    const mountWhenReady = () => {
      if (cancelled) return;
      if (containerRef.current) {
        initJitsi();
        return;
      }
      requestAnimationFrame(mountWhenReady);
    };

    loadJitsiScript(resolvedScriptUrl)
      .then(() => {
        if (!cancelled) mountWhenReady();
      })
      .catch((error) => {
        console.error('[media] failed to load script', error);
        reportMediaError(BOLD_MEDIA_ERROR);
      });

    return () => {
      cancelled = true;
    };
  }, [
    roomName,
    jitsiDomain,
    scriptUrl,
    enabled,
    jwt,
    jwtEnabled,
    moderatorPassword,
    reconnectNonce,
    containerRef,
    disposeSession,
    scheduleReconnect,
    reportMediaError,
  ]);

  useEffect(() => {
    if (enabled) return;

    intentionalLeaveRef.current = true;
    disposeSession();

    const frame = requestAnimationFrame(() => {
      setIsScreenSharing(false);
      setIsPresenterLayout(false);
      setIsAudioMuted(true);
      setIsVideoMuted(true);
      setIsReconnecting(false);
      setJitsiParticipants([]);
      setDominantSpeakerId(null);
      setPinnedParticipantId(null);
      setLocalParticipantId(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [enabled, disposeSession]);

  useEffect(() => {
    return () => {
      intentionalLeaveRef.current = true;
      disposeSession();
    };
  }, [disposeSession]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleShareScreen = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
  }, []);

  const stopShareScreen = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
  }, []);

  const hangup = useCallback(() => {
    intentionalLeaveRef.current = true;
    apiRef.current?.executeCommand('hangup');
  }, []);

  const muteAll = useCallback(() => {
    apiRef.current?.executeCommand('muteEveryone');
  }, []);

  const runJitsiCommand = useCallback((command: string, ...args: unknown[]) => {
    try {
      apiRef.current?.executeCommand(command, ...args);
    } catch {
      // Jitsi builds differ — ignore unsupported commands.
    }
  }, []);

  const setTileView = useCallback((enabled: boolean) => {
    runJitsiCommand('setTileView', enabled);
  }, [runJitsiCommand]);

  const toggleTileView = useCallback(() => {
    runJitsiCommand('toggleTileView');
  }, [runJitsiCommand]);

  const setFilmstripVisible = useCallback((visible: boolean) => {
    runJitsiCommand('setFilmstripEnabled', visible);
  }, [runJitsiCommand]);

  const selfViewHiddenRef = useRef(false);

  const setSelfViewHidden = useCallback(
    (hidden: boolean) => {
      if (selfViewHiddenRef.current === hidden) return;
      runJitsiCommand('toggleSelfView');
      selfViewHiddenRef.current = hidden;
    },
    [runJitsiCommand],
  );

  const pinParticipant = useCallback((participantId: string) => {
    runJitsiCommand('pinParticipant', participantId);
    setPinnedParticipantId(participantId);
  }, [runJitsiCommand]);

  const unpinParticipant = useCallback(() => {
    runJitsiCommand('pinParticipant', null);
    setPinnedParticipantId(null);
  }, [runJitsiCommand]);

  const togglePinParticipant = useCallback(
    (participantId: string) => {
      if (pinnedParticipantId === participantId) {
        unpinParticipant();
        return;
      }
      pinParticipant(participantId);
    },
    [pinParticipant, pinnedParticipantId, unpinParticipant],
  );

  return {
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    stopShareScreen,
    hangup,
    muteAll,
    setTileView,
    toggleTileView,
    setFilmstripVisible,
    setSelfViewHidden,
    pinParticipant,
    unpinParticipant,
    togglePinParticipant,
    isScreenSharing,
    isPresenterLayout,
    isAudioMuted,
    isVideoMuted,
    isReconnecting,
    jitsiParticipants,
    dominantSpeakerId,
    pinnedParticipantId,
    localParticipantId,
  };
}
