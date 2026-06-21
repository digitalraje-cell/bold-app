'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

/**
 * Bold controls when guests may load the media iframe.
 * When JWT auth is enabled, guests join directly with a Bold-issued token.
 * Otherwise guests wait until the host has joined media to avoid public Jitsi login screens.
 */
export function useMeetingPresence(
  meetingId: string,
  isHost: boolean,
  skipHostMediaGate = false,
) {
  const [hostMediaReady, setHostMediaReady] = useState(isHost || skipHostMediaGate);
  const { emit, on } = useSocket(meetingId);

  useEffect(() => {
    if (skipHostMediaGate) {
      setHostMediaReady(true);
      return;
    }

    const applyStatus = (data: unknown) => {
      const { mediaReady, present } = data as { mediaReady?: boolean; present?: boolean };
      if (mediaReady) {
        setHostMediaReady(true);
        return;
      }
      if (present === false) {
        setHostMediaReady(false);
      }
    };

    const unsubStatus = on('host:status', applyStatus);
    const unsubMediaReady = on('host:media-ready', () => setHostMediaReady(true));
    const unsubMediaLeft = on('host:media-left', () => {
      if (!isHost) setHostMediaReady(false);
    });
    const unsubAbsent = on('host:absent', () => {
      if (!isHost) setHostMediaReady(false);
    });

    if (isHost) {
      emit('host:present', {});
    } else {
      emit('host:status:request', {});
    }

    return () => {
      if (isHost) emit('host:absent', {});
      unsubStatus?.();
      unsubMediaReady?.();
      unsubMediaLeft?.();
      unsubAbsent?.();
    };
  }, [meetingId, isHost, skipHostMediaGate, emit, on]);

  const notifyHostMediaReady = useCallback(() => {
    if (isHost) emit('host:media-ready', {});
  }, [isHost, emit]);

  const notifyHostMediaLeft = useCallback(() => {
    if (isHost) emit('host:media-left', {});
  }, [isHost, emit]);

  const canJoinMedia = skipHostMediaGate || isHost || hostMediaReady;

  return {
    hostMediaReady,
    canJoinMedia,
    notifyHostMediaReady,
    notifyHostMediaLeft,
  };
}
