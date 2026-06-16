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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPresenterLayout, setIsPresenterLayout] = useState(false);

  useEffect(() => {
    if (!enabled || !containerRef.current || !roomName) return;

    let api: JitsiExternalAPI | null = null;
    const provider = getMeetingMediaProvider();
    const mediaDomain = provider.getDefaultDomain();

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;

      const embed = provider.buildEmbedOptions({
        roomName,
        displayName,
        isHost,
        allowDesktopSharing,
        startAudioMuted: startMuted,
        startVideoMuted: startVideoMuted,
      });

      console.log('[media] starting jitsi session', {
        domain: embed.domain,
        roomName,
        isHost,
        displayName,
        allowDesktopSharing,
      });

      api = new window.JitsiMeetExternalAPI(embed.domain, {
        roomName: embed.roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: embed.configOverwrite,
        interfaceConfigOverwrite: embed.interfaceConfigOverwrite,
        userInfo: embed.userInfo,
      });

      api.addListener('videoConferenceJoined', () => {
        console.log('[media] video conference joined', { roomName, isHost });
        onReady?.();
      });
      api.addListener('readyToClose', () => onLeave?.());

      api.addListener('loginRequired', () => {
        console.warn(
          '[media] Jitsi loginRequired suppressed — host joins first on community domain',
        );
      });

      api.addListener('screenSharingStatusChanged', (payload: unknown) => {
        const { on } = payload as { on?: boolean };
        const active = Boolean(on);
        setIsScreenSharing(active);
        onScreenShareChange?.(active);
      });

      api.addListener('tileViewChanged', (payload: unknown) => {
        const { enabled: tileView } = payload as { enabled?: boolean };
        const presenter = !tileView;
        setIsPresenterLayout(presenter);
        onPresenterLayoutChange?.(presenter);
      });

      api.addListener('participantRoleChanged', (payload: unknown) => {
        const { role } = payload as { role?: string };
        if (isHost && role && role !== 'moderator') {
          console.warn('[media] host is not Jitsi moderator — guests may see waiting screen');
        }
      });

      apiRef.current = api;
    };

    const scriptUrl = provider.getExternalApiScriptUrl(mediaDomain);

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    }

    return () => {
      api?.dispose();
      apiRef.current = null;
      setIsScreenSharing(false);
      setIsPresenterLayout(false);
    };
  }, [
    roomName,
    displayName,
    isHost,
    enabled,
    allowDesktopSharing,
    containerRef,
    onReady,
    onLeave,
    onScreenShareChange,
    onPresenterLayoutChange,
    startMuted,
    startVideoMuted,
  ]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleShareScreen = useCallback(() => {
    if (!allowDesktopSharing) return;
    apiRef.current?.executeCommand('toggleShareScreen');
  }, [allowDesktopSharing]);

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
  };
}
