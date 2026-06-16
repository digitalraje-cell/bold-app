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
}

interface UseJitsiOptions {
  roomName: string;
  displayName: string;
  isHost?: boolean;
  enabled?: boolean;
  allowDesktopSharing?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
  onLeave?: () => void;
  onScreenShareChange?: (active: boolean) => void;
  onPresenterLayoutChange?: (active: boolean) => void;
  startMuted?: boolean;
  startVideoMuted?: boolean;
}

let jitsiScriptPromise: Promise<void> | null = null;
const MAX_RECONNECT_ATTEMPTS = 6;
const RECONNECT_DELAY_MS = 2000;

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

export function useJitsi({
  roomName,
  displayName,
  isHost = false,
  enabled = true,
  allowDesktopSharing = true,
  containerRef,
  onReady,
  onLeave,
  onScreenShareChange,
  onPresenterLayoutChange,
  startMuted = false,
  startVideoMuted = false,
}: UseJitsiOptions) {
  const apiRef = useRef<JitsiExternalAPI | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const intentionalLeaveRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeObserverRef = useRef<MutationObserver | null>(null);
  const joinedRef = useRef(false);
  const callbacksRef = useRef({
    onReady,
    onLeave,
    onScreenShareChange,
    onPresenterLayoutChange,
  });
  const optionsRef = useRef({
    displayName,
    isHost,
    allowDesktopSharing,
    startMuted,
    startVideoMuted,
  });

  callbacksRef.current = {
    onReady,
    onLeave,
    onScreenShareChange,
    onPresenterLayoutChange,
  };
  optionsRef.current = {
    displayName,
    isHost,
    allowDesktopSharing,
    startMuted,
    startVideoMuted,
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPresenterLayout, setIsPresenterLayout] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(startMuted);
  const [isVideoMuted, setIsVideoMuted] = useState(startVideoMuted);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectNonce, setReconnectNonce] = useState(0);

  const disposeSession = useCallback(() => {
    iframeObserverRef.current?.disconnect();
    iframeObserverRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    sessionKeyRef.current = null;
    joinedRef.current = false;
  }, []);

  const scheduleReconnect = useCallback(
    (reason: string) => {
      if (intentionalLeaveRef.current || !enabled || !roomName) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[media] max reconnect attempts reached', { roomName, reason });
        return;
      }

      reconnectAttemptsRef.current += 1;
      setIsReconnecting(true);
      console.warn('[media] scheduling jitsi reconnect', {
        roomName,
        reason,
        attempt: reconnectAttemptsRef.current,
      });

      disposeSession();
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        setIsReconnecting(false);
        setReconnectNonce((n) => n + 1);
      }, RECONNECT_DELAY_MS);
    },
    [enabled, roomName, disposeSession],
  );

  useEffect(() => {
    if (!enabled || !roomName) return;

    if (reconnectTimerRef.current) {
      return;
    }

    const sessionKey = roomName;
    if (apiRef.current && sessionKeyRef.current === sessionKey) return;

    if (apiRef.current) {
      disposeSession();
    }

    let cancelled = false;
    intentionalLeaveRef.current = false;
    const provider = getMeetingMediaProvider();
    const mediaDomain = provider.getDefaultDomain();
    const scriptUrl = provider.getExternalApiScriptUrl(mediaDomain);

    const watchIframe = () => {
      if (!containerRef.current || cancelled) return;
      const iframe = containerRef.current.querySelector('iframe');
      if (!iframe) return;

      const checkSrc = () => {
        const src = iframe.getAttribute('src') ?? '';
        const looksLikeAd =
          src.includes('8x8') ||
          src.includes('/promo') ||
          src.includes('jaas') ||
          (src.length > 0 && !src.includes(encodeURIComponent(roomName)) && !src.includes(roomName));
        if (looksLikeAd && joinedRef.current) {
          scheduleReconnect('iframe-navigated-away');
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
        allowDesktopSharing: opts.allowDesktopSharing,
        startAudioMuted: opts.startMuted,
        startVideoMuted: opts.startVideoMuted,
      });

      console.log('[media] starting jitsi session', {
        domain: embed.domain,
        roomName,
        isHost: opts.isHost,
        displayName: opts.displayName,
      });

      const api = new window.JitsiMeetExternalAPI(embed.domain, {
        roomName: embed.roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: embed.configOverwrite,
        interfaceConfigOverwrite: embed.interfaceConfigOverwrite,
        userInfo: embed.userInfo,
      });

      api.addListener('videoConferenceJoined', () => {
        joinedRef.current = true;
        reconnectAttemptsRef.current = 0;
        setIsReconnecting(false);
        console.log('[media] video conference joined', { roomName, isHost: opts.isHost });
        if (opts.isHost) {
          try {
            api.executeCommand('toggleLobby', false);
          } catch {
            // lobby may be disabled in config
          }
        }
        watchIframe();
        callbacksRef.current.onReady?.();
      });

      api.addListener('readyToClose', () => {
        intentionalLeaveRef.current = true;
        callbacksRef.current.onLeave?.();
      });

      api.addListener('videoConferenceLeft', () => {
        if (!intentionalLeaveRef.current) {
          scheduleReconnect('videoConferenceLeft');
        }
      });

      api.addListener('connectionFailed', () => {
        scheduleReconnect('connectionFailed');
      });

      api.addListener('errorOccurred', (payload: unknown) => {
        console.warn('[media] jitsi errorOccurred', payload);
        scheduleReconnect('errorOccurred');
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
        console.warn('[media] loginRequired — reconnecting to suppress Jitsi login/ad page');
        scheduleReconnect('loginRequired');
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

    loadJitsiScript(scriptUrl)
      .then(() => {
        if (!cancelled) mountWhenReady();
      })
      .catch((error) => {
        console.error('[media] failed to load Jitsi script', error);
        scheduleReconnect('script-load-failed');
      });

    return () => {
      cancelled = true;
    };
  }, [roomName, enabled, reconnectNonce, containerRef, disposeSession, scheduleReconnect]);

  useEffect(() => {
    if (enabled) return;

    intentionalLeaveRef.current = true;
    disposeSession();
    setIsScreenSharing(false);
    setIsPresenterLayout(false);
    setIsAudioMuted(true);
    setIsVideoMuted(true);
    setIsReconnecting(false);
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

  return {
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    stopShareScreen,
    hangup,
    muteAll,
    isScreenSharing,
    isPresenterLayout,
    isAudioMuted,
    isVideoMuted,
    isReconnecting,
  };
}
