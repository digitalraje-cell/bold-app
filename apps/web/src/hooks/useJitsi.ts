'use client';

import { useEffect, useRef, useCallback } from 'react';

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
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
  onLeave?: () => void;
  startMuted?: boolean;
  startVideoMuted?: boolean;
}

export function useJitsi({
  roomName,
  displayName,
  containerRef,
  onReady,
  onLeave,
  startMuted = false,
  startVideoMuted = false,
}: UseJitsiOptions) {
  const apiRef = useRef<JitsiExternalAPI | null>(null);
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';

  useEffect(() => {
    if (!containerRef.current || !roomName) return;

    let api: JitsiExternalAPI | null = null;

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;

      api = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: startMuted,
          startWithVideoMuted: startVideoMuted,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [],
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          FILM_STRIP_MAX_HEIGHT: 120,
          DEFAULT_BACKGROUND: '#0f172a',
        },
        userInfo: {
          displayName,
        },
      });

      api.addListener('videoConferenceJoined', () => onReady?.());
      api.addListener('readyToClose', () => onLeave?.());

      apiRef.current = api;
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    }

    return () => {
      api?.dispose();
      apiRef.current = null;
    };
  }, [roomName, displayName, domain, containerRef, onReady, onLeave, startMuted, startVideoMuted]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleShareScreen = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
  }, []);

  const hangup = useCallback(() => {
    apiRef.current?.executeCommand('hangup');
  }, []);

  return { toggleAudio, toggleVideo, toggleShareScreen, hangup };
}
