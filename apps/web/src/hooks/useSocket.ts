'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { getSocketOrigin } from '@/lib/api-base';

let socket: Socket | null = null;

export function useSocket(meetingId: string) {
  useEffect(() => {
    const socketUrl = getSocketOrigin();
    socket = io(`${socketUrl}/meetings`, {
      query: { meetingId },
      transports: ['websocket'],
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [meetingId]);

  const emit = useCallback((event: string, data: unknown) => {
    socket?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socket?.on(event, handler);
    return () => {
      socket?.off(event, handler);
    };
  }, []);

  return { emit, on, socket };
}

export function getSocket() {
  return socket;
}
