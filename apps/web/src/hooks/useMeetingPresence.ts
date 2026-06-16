'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

/**
 * Bold controls when guests may load Jitsi.
 * Guests wait until the host has joined the media conference (not just the Bold room).
 * This prevents Jitsi "waiting for moderator" / meet.jit.si OAuth popups.
 */
export function useMeetingPresence(meetingId: string, isHost: boolean) {
  const [hostMediaReady, setHostMediaReady] = useState(isHost);
  const { emit, on } = useSocket(meetingId);

  useEffect(() => {
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
  }, [meetingId, isHost, emit, on]);

  const notifyHostMediaReady = useCallback(() => {
    if (isHost) emit('host:media-ready', {});
  }, [isHost, emit]);

  const notifyHostMediaLeft = useCallback(() => {
    if (isHost) emit('host:media-left', {});
  }, [isHost, emit]);

  const canJoinMedia = isHost || hostMediaReady;

  return {
    hostMediaReady,
    canJoinMedia,
    notifyHostMediaReady,
    notifyHostMediaLeft,
  };
}
