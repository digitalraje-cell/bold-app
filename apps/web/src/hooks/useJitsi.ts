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

  useEffect(() => {
    if (!enabled || !roomName) return;

    const sessionKey = roomName;
    if (apiRef.current && sessionKeyRef.current === sessionKey) return;

    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
      sessionKeyRef.current = null;
    }

    let cancelled = false;
    const provider = getMeetingMediaProvider();
    const mediaDomain = provider.getDefaultDomain();
    const scriptUrl = provider.getExternalApiScriptUrl(mediaDomain);

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
        console.log('[media] video conference joined', { roomName, isHost: opts.isHost });
        callbacksRef.current.onReady?.();
      });
      api.addListener('readyToClose', () => callbacksRef.current.onLeave?.());

      api.addListener('audioMuteStatusChanged', (payload: unknown) => {
        const { muted } = payload as { muted?: boolean };
        if (typeof muted === 'boolean') setIsAudioMuted(muted);
      });

      api.addListener('videoMuteStatusChanged', (payload: unknown) => {
        const { muted } = payload as { muted?: boolean };
        if (typeof muted === 'boolean') setIsVideoMuted(muted);
      });

      api.addListener('loginRequired', () => {
        console.warn(
          '[media] Jitsi loginRequired suppressed — host joins first on community domain',
        );
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

      api.addListener('participantRoleChanged', (payload: unknown) => {
        const { role } = payload as { role?: string };
        if (opts.isHost && role && role !== 'moderator') {
          console.warn('[media] host is not Jitsi moderator — guests may see waiting screen');
        }
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
      });

    return () => {
      cancelled = true;
    };
  }, [roomName, enabled, containerRef]);

  useEffect(() => {
    if (enabled) return;

    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
      sessionKeyRef.current = null;
    }
    setIsScreenSharing(false);
    setIsPresenterLayout(false);
    setIsAudioMuted(true);
    setIsVideoMuted(true);
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
        sessionKeyRef.current = null;
      }
    };
  }, []);

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
  };
}
